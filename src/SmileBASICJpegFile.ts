import { FILE_TYPES } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

class SmileBASICJpegFile extends SmileBASICFile {
    public Content: Buffer;

    public constructor() {
        super();
        this.Content = Buffer.alloc(0);
    }

    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICJpegFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Jpeg
        ) {
            throw new Error("File does not have Text file type");
        }

        let file = new SmileBASICJpegFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = file.RawContent;

        return file;
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICJpegFile> {
        let file = await super.FromBuffer(input, verifyFooter);

        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        this.RawContent = this.Content;
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        AsJpegFile(): Promise<SmileBASICJpegFile>;
    }
}

SmileBASICFile.prototype[ "AsJpegFile" ] = async function () {
    return await SmileBASICJpegFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Jpeg, SmileBASICJpegFile);


export { SmileBASICJpegFile };