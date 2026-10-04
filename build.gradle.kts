import org.apache.tools.ant.filters.ReplaceTokens
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

plugins {
    id("java")
}

val certPassword = providers.gradleProperty("sign.cert.password").orElse("UNSET").get()
val curseforgeToken = providers.gradleProperty("curseforge.token").orElse("UNSET").get()
val apexName = "Reditus Magnificus"
val apexType = "gradle"
val apexVendor = "Zyneon Apex"
val buildNumber: String = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd-HHmmss"))

group = "com.zyneonstudios.apex"
version = "4.0.2"

repositories {
    mavenCentral()
    maven {
        name = "nerofySnapshots"
        url = uri("https://maven.nrfy.net/snapshots")
    }
    maven {
        name = "nerofyReleases"
        url = uri("https://maven.nrfy.net/releases")
    }
}

dependencies {
    implementation("com.zyneonstudios.apex:jauri-webview:0.34")
    implementation("org.springframework.boot:spring-boot-starter-web:4.1.1")
    implementation("org.xerial:sqlite-jdbc:3.53.4.0")
}

tasks.processResources {
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