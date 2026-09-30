import {ApplicationStatus, getApplicationStatus} from "@/assets/zyneonstudios/scripts/types";

export const openExternal = (url: string) => {
    if (window.openUrl) {
        window.openUrl(url);
    } else {
        window.open(url, '_blank');
    }
};

export const reportIssue = async (title:string, issue:string) => {
    const applicationStatus:ApplicationStatus = await getApplicationStatus();

    const version = applicationStatus.version.number;
    const versionBuild = applicationStatus.version.build;
    const versionType = applicationStatus.version.type;
    const versionName = applicationStatus.version.name;

    const os = applicationStatus.system.os.name + " (" + applicationStatus.system.os.version + ")";
    const arch = applicationStatus.system.os.arch;

    const issueTitle = title;
    const issueBody = `##### NEX App information
* **Version Number:** ${version}
* **Version Build:** ${versionBuild}
* **Version Type:** ${versionType}
* **Version Name:** ${versionName}

#### System information
* **Operating System:** ${os}
* **Architecture:** ${arch}

###### Do not change the auto generated system and application info above this line!
---

### Issue description:
${issue}
`;
    const githubUrl = `https://github.com/nerotvlive/nex-app/issues/new?labels=bug&title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
    openExternal(githubUrl);
};