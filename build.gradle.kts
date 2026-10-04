plugins {
    id("java")
}

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
    testImplementation(platform("org.junit:junit-bom:6.0.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    implementation("com.zyneonstudios.apex:jauri-webview:0.34")
    implementation("org.springframework.boot:spring-boot-starter-web:4.1.1")
    implementation("org.xerial:sqlite-jdbc:3.53.4.0")
}

tasks.test {
    useJUnitPlatform()
}