/// <reference types="@types/node" />
import { SmileBASICFile } from "./";
import { promises as fs } from "fs";

let filename = process.argv[ 2 ];
if (filename == null) {
    console.error("Parse a SmileBASIC file and dump various parts of it. Useful for checking what's exactly causing files to fail parsing.");
    console.error("Usage: ts-node DumpUnknownFileInfo.ts <filename>");
    console.error("Will write 2-3 files: <filename>.info.json, <filename>.content.bin, and <filename>.parsed.json.");
    process.exit(1);
}

fs.readFile(filename)
    .then(async buffer => {
        let result = await SmileBASICFile.FromBuffer(buffer) as any;

        await fs.writeFile(filename + ".content.bin", result.RawContent);

        delete result.RawContent;
        await fs.writeFile(filename + ".info.json", JSON.stringify(result));

        try {
            let r = await result.ToActualType() as any;
            delete r.RawContent;
            fs.writeFile(filename + ".parsed.json", JSON.stringify(r));
            console.log("File parsing successful; check the parsed.json to see the result.");
        } catch (e) {
            console.error("File parsing failed; please check the error provided and the info.json and content.bin generated to figure out what happened.");
            console.error("The error - " + e.stack);
        }
    });
