import { Header } from "./Header";
import { inflate, deflate } from "zlib";
import { promisify } from "util";
import { FILE_HEADER_SIZE, FILE_OFFSETS, HMAC_KEY } from "./Constants";
import { createHmac } from "crypto";

// Promisify these guys so we aren't using callbacks
const inflateAsync = promisify(inflate);
const deflateAsync = promisify(deflate);

class SmileBASICFile {
    public Header: Header;
    public RawContent: Buffer;
    public Footer: Buffer;

    public constructor() {
        this.Header = new Header();
        this.RawContent = Buffer.alloc(0);
        this.Footer = Buffer.alloc(20);
    }

    public static VerifyFooter(input: Buffer): boolean {
        let hmacInstance = createHmac("sha1", HMAC_KEY);
        hmacInstance.update(input.slice(0, input.length - FILE_OFFSETS["FOOTER_SIZE"]));

        let calculatedHash = hmacInstance.digest();
        let footer = input.slice(input.length - FILE_OFFSETS["FOOTER_SIZE"]);
        return calculatedHash.equals(footer);
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICFile> {
        if (verifyFooter && !this.VerifyFooter(input)) {
            throw new Error("File footer is invalid!");
        }

        var output = new SmileBASICFile();

        var header = Header.FromBuffer(input);
        var headerSize = FILE_HEADER_SIZE[header.Version];

        var content = Buffer.alloc(input.length - headerSize - FILE_OFFSETS["FOOTER_SIZE"]);
        input.copy(content, 0, headerSize);

        if (header.IsCompressed) {
            content = await inflateAsync(content);
        }

        var footer = Buffer.alloc(FILE_OFFSETS["FOOTER_SIZE"]);
        input.copy(content, 0, input.length - FILE_OFFSETS["FOOTER_SIZE"]);

        output.Header = header;
        output.RawContent = content;
        output.Footer = footer;

        return output;
    }

    // TODO: Implement these marshalling functions with the appropriate checks.
    public AsTextFile() { }
    public AsDataFile() { }
    public AsProjectFile() { }
    public AsMetaFile() { }

    private getRawContent(): Promise<Buffer> {
        throw new Error(`${this.constructor.name}: Please implement getRawContent()`);
    };

    public async GetCompressedContent(): Promise<Buffer> {
        return await deflateAsync(this.RawContent);
    }

    // TODO: Implement new footer calculation
    public async CalculateFooter() { }
}

export { SmileBASICFile }