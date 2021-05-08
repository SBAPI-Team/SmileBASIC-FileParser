import { FILE_TYPES } from "./Constants";
import { SmileBASIC4ProjectContent } from "./SmileBASIC4ProjectContent";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

class SmileBASIC4ProjectFile extends SmileBASICFile {
    public Content: SmileBASIC4ProjectContent;

    public constructor() {
        super();
        this.Content = new SmileBASIC4ProjectContent();
    }

    public static async FromFile(input: SmileBASICFile): Promise<SmileBASIC4ProjectFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Project4
        ) {
            throw new Error("File does not have Project4 file type");
        }

        let file = new SmileBASIC4ProjectFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = await SmileBASIC4ProjectContent.FromBuffer(file.RawContent);

        return file;
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASIC4ProjectFile> {
        let file = await super.FromBuffer(input, verifyFooter);

        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        this.RawContent = await this.Content.ToBuffer();
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        AsProject4File(): Promise<SmileBASIC4ProjectFile>;
    }
}

SmileBASICFile.prototype[ "AsProject4File" ] = async function () {
    return SmileBASIC4ProjectFile.FromFile(this);
};

export { SmileBASIC4ProjectFile };