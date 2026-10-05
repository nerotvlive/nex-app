import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import com.github.gradle.node.pnpm.task.PnpmTask
import org.apache.tools.ant.filters.ReplaceTokens
import java.util.UUID

plugins {
    java
    id("com.github.node-gradle.node") version "7.1.0"
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.zyneonstudios.apex"
version = "4.0.2"

val jsign = configurations.create("jsign")
val certFile = file("cert.pfx")
val certPassword = providers.gradleProperty("sign.cert.password").orElse("UNSET").get()
val curseforgeToken = providers.gradleProperty("curseforge.token").orElse("UNSET").get()
val installerUUID = providers.gradleProperty("nexapp.installer.uuid").orElse(UUID.randomUUID().toString()).get()
val apexName = "Reditus Magnificus"
val apexType = "alpha"
val apexVendor = "Zyneon Apex"
val buildNumber: String = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd-HHmmss"))

val frontendDir = file("src/frontend")
val packageJson = frontendDir.resolve("package.json")

node {
    version = "24.20.0"
    pnpmVersion = "12.9.0"
    download = true
    nodeProjectDir = frontendDir
}

val installFrontend = tasks.register<PnpmTask>("installFrontend") {
    description = "Initializes the frontend dependencies"
    dependsOn("pnpmSetup")
    args = listOf("install")
    onlyIf { packageJson.exists() }
    inputs.file(packageJson).optional()
    inputs.file(frontendDir.resolve("pnpm-lock.yaml")).optional()
    outputs.dir(frontendDir.resolve("node_modules"))
}

val buildFrontend = tasks.register<PnpmTask>("buildFrontend") {
    description = "Builds and bundles the frontend"
    dependsOn(installFrontend)
    args = listOf("run", "build")
    onlyIf { packageJson.exists() }
    inputs.dir(frontendDir.resolve("src")).optional()
    inputs.file(packageJson).optional()
    outputs.dir(frontendDir.resolve("dist"))
}

repositories {
    mavenCentral()
    maven("https://maven.nrfy.net/snapshots") { name = "nerofySnapshots" }
    maven("https://maven.nrfy.net/releases") { name = "nerofyReleases" }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:4.1.1")
    implementation("com.zyneonstudios.apex:jauri-webview:0.34")
    implementation("org.xerial:sqlite-jdbc:3.53.4.0")

    jsign("net.jsign:jsign:7.5")
}

tasks.jar {
    enabled = false
}

tasks.processResources {
    dependsOn(buildFrontend)
    into("static") { from(frontendDir.resolve("dist")) }
    val tokens = mapOf(
        "project.version" to project.version.toString(),
        "apex.name" to apexName,
        "apex.type" to apexType,
        "build.number" to buildNumber,
        "curseforge.token" to curseforgeToken
    )
    inputs.properties(tokens)
    filesMatching("**/bootstrap.properties") {
        filter<ReplaceTokens>("tokens" to tokens)
    }
}

tasks.bootRun {
    args("-v")
}

tasks.register("dev") {
    group = "application"
    description = "Starts the application in development mode and the vite server in the background"
    dependsOn(installFrontend)
    finalizedBy("bootRun")
    doLast {
        val pnpmCmd = if (System.getProperty("os.name").lowercase().contains("win")) "pnpm.cmd" else "pnpm"
        val process = ProcessBuilder(pnpmCmd, "run", "dev")
            .directory(frontendDir)
            .inheritIO()
            .start()
        gradle.buildFinished {
            process.descendants().forEach { it.destroyForcibly() }
            process.destroyForcibly()
        }
    }
}

val jpackagePath = javaToolchains.compilerFor {
    languageVersion = JavaLanguageVersion.of(25)
}.map { it.metadata.installationPath.file("bin/jpackage").asFile.absolutePath }

tasks.register<Exec>("buildWindowsBinary") {
    description = "Builds a native Windows binary using jpackage"
    dependsOn("build")
    group = "distribution"
    executable = jpackagePath.get()
    args(
        "--type", "app-image",
        "--input", layout.buildDirectory.dir("libs").get().asFile.absolutePath,
        "--dest", layout.buildDirectory.dir("windows").get().asFile.absolutePath,
        "--name", "NEX App",
        "--app-version", project.version.toString(),
        "--vendor", apexVendor,
        "--main-jar", tasks.bootJar.get().archiveFileName.get(),
        "--main-class", "org.springframework.boot.loader.launch.JarLauncher",
        "--icon", file("src/main/resources/icon.ico").absolutePath,
        "--java-options", "--enable-native-access=ALL-UNNAMED",
    )
}

val installerTasks = listOf("msi", "exe").map { type ->
    tasks.register<Exec>("buildWindowsInstaller${type.uppercase()}") {
        description = "Builds a native Windows .$type installer using jpackage"
        group = "distribution"
        dependsOn("buildWindowsBinary")
        dependsOn("signWindowsBinary")
        executable = jpackagePath.get()
        args(
            "--type", type,
            "--app-image", layout.buildDirectory.dir("windows/NEX App").get().asFile.absolutePath,
            "--dest", layout.buildDirectory.dir("windows/installers").get().asFile.absolutePath,
            "--name", "NEX App",
            "--app-version", project.version.toString(),
            "--vendor", apexVendor,
            "--resource-dir", file("files/Windows").absolutePath,
            "--icon", file("src/main/resources/setup.ico").absolutePath,
            "--win-dir-chooser",
            "--win-shortcut",
            "--win-menu",
            "--win-menu-group", apexVendor,
            "--win-upgrade-uuid", installerUUID
        )
    }
}

tasks.register("buildWindowsInstallers") {
    group = "distribution"
    description = "Builds both .msi and .exe native installers using jpackage"
    dependsOn(installerTasks)
}

fun registerSignTask(taskName: String, dependsOnTask: Any, targetFiles: () -> List<File>) =
    tasks.register<JavaExec>(taskName) {
        group = "distribution"
        description = "Signs specified binaries using Jsign"
        dependsOn(dependsOnTask)
        classpath = jsign
        mainClass = "net.jsign.JsignCLI"
        onlyIf { certFile.exists() && certPassword != "UNSET" }
        doFirst {
            val existingFiles = targetFiles().filter { it.exists() }
            existingFiles.forEach { file ->
                file.setWritable(true)
            }
            val files = existingFiles.map { it.absolutePath }
            if (files.isNotEmpty()) {
                args = listOf(
                    "--keystore", certFile.absolutePath,
                    "--storepass", certPassword,
                    "--tsaurl", "http://timestamp.digicert.com"
                ) + files
            }
        }
    }

val signWindowsBinary = registerSignTask("signWindowsBinary", "buildWindowsBinary") {
    listOf(layout.buildDirectory.file("windows/NEX App/NEX App.exe").get().asFile)
}

val signWindowsInstallers = registerSignTask("signWindowsInstallers", installerTasks) {
    layout.buildDirectory.dir("windows/installers").get().asFile
        .listFiles { _, name -> name.endsWith(".msi") || name.endsWith(".exe") }?.toList() ?: emptyList()
}