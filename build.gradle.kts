import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import com.github.gradle.node.pnpm.task.PnpmTask
import org.apache.tools.ant.filters.ReplaceTokens

plugins {
    java
    id("com.github.node-gradle.node") version "7.1.0"
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.zyneonstudios.apex"
version = "4.0.2"

val curseforgeToken = providers.gradleProperty("curseforge.token").orElse("UNSET").get()
val apexName = "Reditus Magnificus"
val apexType = "gradle"
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
        println("Starting vite via pnpm...")
        val viteProcess = ProcessBuilder(pnpmCmd, "run", "dev")
            .directory(frontendDir)
            .inheritIO()
            .start()
        Runtime.getRuntime().addShutdownHook(Thread { viteProcess.destroyForcibly() })
    }
}