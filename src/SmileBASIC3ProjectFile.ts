import { FILE_TYPES } from "./Constants";
import { SmileBASIC3ProjectContent } from "./SmileBASIC3ProjectContent.1";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

class SmileBASIC3ProjectFile extends SmileBASICFile {
    public Content: SmileBASIC3ProjectContent;

    public constructor() {
        super();
        this.Content = new SmileBASIC3ProjectContent();
    }

    public static async FromFile(input: SmileBASICFile): Promise<SmileBASIC3ProjectFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Project3
        ) {
            throw new Error("File does not have Text file type");
        }

        let file = new SmileBASIC3ProjectFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = await SmileBASIC3ProjectContent.FromBuffer(file.RawContent);

        return file;
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASIC3ProjectFile> {
        let file = await super.FromBuffer(input, verifyFooter);

        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        // TODO: Implement SmileBASIC3ProjectFile#ToBuffer()
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        AsProject3File(): Promise<SmileBASIC3ProjectFile>;
    }
}

SmileBASICFile.prototype[ "AsProject3File" ] = async function () {
    return SmileBASIC3ProjectFile.FromFile(this);
};

export { SmileBASIC3ProjectFile };