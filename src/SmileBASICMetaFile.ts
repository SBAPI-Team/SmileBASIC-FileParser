import { FILE_TYPES } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";
import { SmileBASICMetaContent } from "./SmileBASICMetaContent";

/**
 * Implements operations for reading and writing SmileBASIC {@link SmileBASICFileType.Meta} files.
 */
class SmileBASICMetaFile extends SmileBASICFile {
    /**
     * The content of the file, stored in a {@link SmileBASICMetaContent} instance.
     */
    public Content: SmileBASICMetaContent;

    public constructor() {
        super();
        this.Content = new SmileBASICMetaContent();
    }

    /**
         * Converts a base {@link SmileBASICFile} instance into a {@link SmileBASICMetaFile}.
         * @param input The base {@link SmileBASICFile} instance to convert.
         * @returns A Promise resolving to the input file, converted to a SmileBASICMetaFile instance.
         */
    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICMetaFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Meta
        ) {
            throw new Error("File does not have Meta file type");
        }

        let file = new SmileBASICMetaFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = SmileBASICMetaContent.FromBuffer(file.RawContent);

        return file;
    }

    /**
     * Creates a {@link SmileBASICMetaFile} instance from the provided SmileBASIC format file (as a Buffer). Optionally, also verify the footer and throw an error if it is incorrect.
     * 
     * **Warning: There is no proper handling of SmileBASICMetaFiles not heaving footers yet.**
     * @param input A Buffer storing a raw SmileBASIC file
     * @param verifyFooter Set to `true` to throw an error if the file has an invalid footer.
     * @returns A Promise resolving to a SmileBASICMetaFile instance.
     */
    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICMetaFile> {
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
        /**
        * Converts a SmileBASICFile instance to a SmileBASICMetaFile.
        */
        AsMetaFile(): Promise<SmileBASICMetaFile>;
    }
}

SmileBASICFile.prototype[ "AsMetaFile" ] = async function () {
    return await SmileBASICMetaFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Meta, SmileBASICMetaFile);


export { SmileBASICMetaFile };