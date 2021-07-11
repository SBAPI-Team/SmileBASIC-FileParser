import { Header } from "./Header";
import { inflate, deflate } from "zlib";
import { promisify } from "util";
import { FILE_HEADER_SIZE, FILE_OFFSETS, FILE_TYPES, HMAC_KEY } from "./Constants";
import { createHmac } from "crypto";
import { SmileBASICFileType } from "./SmileBASICFileType";
import { SmileBASICFileVersion } from "./SmileBASICFileVersion";

// Promisify these guys so we aren't using callbacks
const inflateAsync = promisify(inflate);
const deflateAsync = promisify(deflate);


/**
 * A base SmileBASIC file implementation.
 * 
 * If you wish to use file format-specific methods, you can use the {@link SmileBASICFile.ToActualType ToActualType() method} to convert a base instance into the proper file format.
 */
class SmileBASICFile {
    /**
     * The parsed {@link Header} of this file.
     */
    public Header: Header;

    /**
     * Stores the raw contents of this file as a raw Buffer.
     */
    public RawContent: Buffer;

    /**
     * Stores the SHA-1 HMAC footer of this file, if present. META files do not have a footer.
     */
    public Footer: Buffer;

    /**
     * Maps {@link SmileBASICFileType SmileBASICFileTypes} to different SmileBASIC file subtypes.
     * 
     * Used by {@link SmileBASICFile.ToActualType ToActualType()}
     * @internal
     */
    public static FileTypeMappings: Map<SmileBASICFileType, typeof SmileBASICFile> = new Map();

    /**
     * Returns the type of file as a normalized {@link SmileBASICFileType}, or `null` if the file type is invalid.
     */
    public get Type(): SmileBASICFileType | null {
        if (!(this.Header.FileType in FILE_TYPES[ this.Header.Version ])) {
            return null;
        } else {
            return FILE_TYPES[ this.Header.Version ][ this.Header.FileType as keyof typeof FILE_TYPES[ keyof typeof FILE_TYPES ] ];
        }
    }

    /**
     * Creates an empty SmileBASIC file instance.
     */
    public constructor() {
        this.Header = new Header();

        // What's the difference between Buffer.alloc and Buffer.allocUnsafe?
        // alloc will initialize the memory (by default to all 0's), while allocUnsafe will not
        // Thus, allocUnsafe is faster and doesn't require as much work.
        // We try to use allocUnsafe for the majority of cases, mostly because we're copying around data into a lot of these buffers that is just going to overwrite the initialized buffer.
        // As well, when building files, we're really just going to be overwriting the memory anyways
        this.RawContent = Buffer.allocUnsafe(0);
        this.Footer = Buffer.alloc(20);
    }

    /**
     * Verifies the footer of a (presumed) SmileBASIC file in a Buffer.
     * @param input A Buffer storing a raw SmileBASIC file 
     * @returns `true` if the footer is correct, `false` otherwise.
     */
    public static VerifyFooter(input: Buffer): boolean {
        let hmacInstance = createHmac("sha1", HMAC_KEY);
        hmacInstance.update(input.slice(0, input.length - FILE_OFFSETS[ "FOOTER_SIZE" ]));

        let calculatedHash = hmacInstance.digest();
        let footer = input.slice(input.length - FILE_OFFSETS[ "FOOTER_SIZE" ]);
        return calculatedHash.equals(footer);
    }

    /**
     * Creates a {@link SmileBASICFile} instance from the provided SmileBASIC format file (as a Buffer). Optionally, also verify the footer and throw an error if it is incorrect.
     * @param input A Buffer storing a raw SmileBASIC file
     * @param verifyFooter Set to `true` to throw an error if the file has an invalid footer. 
     * @returns A Promise resolving to a SmileBASICFile instance.
     */
    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICFile> {
        if (verifyFooter && !this.VerifyFooter(input)) {
            throw new Error("File footer is invalid!");
        }

        let output = new SmileBASICFile();

        let header = Header.FromBuffer(input);
        let headerSize = FILE_HEADER_SIZE[ header.Version ];

        let content = Buffer.allocUnsafe(input.length - headerSize - (FILE_TYPES[ header.Version ][ header.FileType as keyof typeof FILE_TYPES[ keyof typeof FILE_TYPES ] ] !== SmileBASICFileType.Meta ? FILE_OFFSETS[ "FOOTER_SIZE" ] : 0));
        input.copy(content, 0, headerSize);

        if (header.IsCompressed) {
            content = await inflateAsync(content);
        }

        let footer = Buffer.alloc(FILE_OFFSETS[ "FOOTER_SIZE" ]);

        if (FILE_TYPES[ header.Version ][ header.FileType as keyof typeof FILE_TYPES[ keyof typeof FILE_TYPES ] ] !== SmileBASICFileType.Meta)
            input.copy(footer, 0, input.length - FILE_OFFSETS[ "FOOTER_SIZE" ]);

        output.Header = header;
        output.RawContent = content;
        output.Footer = footer;

        return output;
    }

    /**
     * In an inherited type, converts a base {@see SmileBASICFile} to the type. By default, is an identity function.
     * @param input The SmileBASICFile instance to convert.
     * @returns A SmileBASICFile instance.
     */
    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICFile> {
        return input;
    }

    /**
     * Encodes the file to a Buffer containing a raw SmileBASIC file.
     * @returns A Promise resolving to a Buffer containing the raw SmileBASIC file.
     */
    public async ToBuffer(): Promise<Buffer> {

        let header = this.Header.ToBuffer();
        let content = this.RawContent;
        if (this.Header.IsCompressed) {
            content = await this.GetCompressedContent();
        }
        let result: Buffer;
        if (this.Type !== SmileBASICFileType.Meta) {
            await this.CalculateFooter();
            let footer = this.Footer;

            result = Buffer.concat([ header, content, footer ]);

            if (!SmileBASICFile.VerifyFooter(result)) {
                throw new Error("Something's wrong with footer generation.");
            }
        } else {
            result = Buffer.concat([ header, content ]);
        }
        return result;
    }

    /**
     * Returns the {@link SmileBASICFile.RawContent raw file content}, compressed using zlib compression.
     * @returns A Promise, resolving to a Buffer containing the compressed content.
     */
    public async GetCompressedContent(): Promise<Buffer> {
        return await deflateAsync(this.RawContent);
    }

    /**
     * Calculates the footer for the expected content, writing it to {@link SmileBASICFile.Footer the Footer property of this instance.}
     */
    public async CalculateFooter() {
        let header = this.Header.ToBuffer();

        let content = this.RawContent;
        if (this.Header.IsCompressed) {
            content = await this.GetCompressedContent();
        }

        let fullFile = Buffer.concat([ header, content ]);

        let hmacInstance = createHmac("sha1", HMAC_KEY);
        hmacInstance.update(fullFile);

        this.Footer = hmacInstance.digest();
    }

    /**
     * Converts the file to its actual type.
     * @throws if the file type is invalid.
     * @returns A Promise, resolving to the specific {@link SmileBASICFile} subclass for this instance's type.
     */
    public async ToActualType(): Promise<SmileBASICFile> {
        if (this.Type !== null && SmileBASICFile.FileTypeMappings.has(this.Type)) {
            return SmileBASICFile.FileTypeMappings.get(this.Type)!.FromFile(this);
        } else {
            throw new Error(`Unimplemented file type ${this.Type} (version ${SmileBASICFileVersion[ this.Header.Version ]}, type ${this.Header.FileType})`);
        }
    }
}

export { SmileBASICFile };