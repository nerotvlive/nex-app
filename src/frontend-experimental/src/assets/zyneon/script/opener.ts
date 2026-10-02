export class opener {

    openWithDefault = async (url: string): Promise<void> => {
        console.log("Opening URL:", url);
    }
}

export const Opener = new opener();