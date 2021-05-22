import * as fs from "fs";
import * as path from "path";
import { Header, SmileBASICFile, SmileBASICTextFile, SmileBASICFileType, SmileBASICDataFile, SmileBASIC3ProjectFile, SmileBASIC4ProjectFile, SmileBASICMetaFile } from "../src";

test("creating new SmileBASICFile instance works", () => {
    let file = new SmileBASICFile();
    expect(file).toBeInstanceOf(SmileBASICFile);
});

test("SmileBASICFile#ToBuffer works", async () => {
    let file = new SmileBASICFile();
    file.RawContent = Buffer.from("Test\n", "ascii");

    let result = await file.ToBuffer();
    expect(result).toBeInstanceOf(Buffer);
});

test("parsing file made by SmileBASICFile#ToBuffer works", async () => {
    let file = new SmileBASICFile();
    file.RawContent = Buffer.from("Test\n", "ascii");

    let result = await file.ToBuffer();
    let newFile = await SmileBASICFile.FromBuffer(result);

    expect(newFile).toBeInstanceOf(SmileBASICFile);
    expect(newFile.RawContent.toString("ascii")).toBe("Test\n");
});

let example_binaries = fs.readdirSync(path.join(__dirname, "example_binaries"));
for (let filename of example_binaries) {
    test(`${filename} parses successfully`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));

        expect(file).toBeInstanceOf(SmileBASICFile);

        expect(file.Header).toBeInstanceOf(Header);
        expect(file.RawContent).toBeInstanceOf(Buffer);
        expect(file.Footer).toBeInstanceOf(Buffer);
    });
    test(`${filename} parses successfully with footer verification`, async () => {
        let file = await SmileBASICFile.FromBuffer(
            fs.readFileSync(path.join(__dirname, "example_binaries", filename)),
            true);

        expect(file).toBeInstanceOf(SmileBASICFile);

        expect(file.Header).toBeInstanceOf(Header);
        expect(file.RawContent).toBeInstanceOf(Buffer);
        expect(file.Footer).toBeInstanceOf(Buffer);
    });
    test(`${filename} ToBuffer is parsable and passes footer verification`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));
        if (file.Type === SmileBASICFileType.Meta)
            return;

        let buffer = await file.ToBuffer();

        expect(buffer).toBeInstanceOf(Buffer);
        let newFile = await SmileBASICFile.FromBuffer(buffer);

        expect(newFile).toBeInstanceOf(SmileBASICFile);
    });
    test(`${filename} can be parsed to the native format`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));
        let newFile = await file.ToActualType();

        if (newFile instanceof SmileBASIC3ProjectFile || newFile instanceof SmileBASIC4ProjectFile) {
            for (let [ name, file ] of newFile.Content.Files) {
                let subfile = await file.ToActualType();
                expect(subfile).toBeDefined();
            }
        }
    });
    test(`${filename} to native type, ToBuffer is parsable`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));
        let newFile = await file.ToActualType();
        let buffer = await newFile.ToBuffer();

        expect(buffer).toBeInstanceOf(Buffer);

        let parsedFile = await SmileBASICFile.FromBuffer(buffer);
        expect(parsedFile).toBeInstanceOf(SmileBASICFile);

        if (newFile instanceof SmileBASIC3ProjectFile || newFile instanceof SmileBASIC4ProjectFile) {
            for (let [ name, file ] of newFile.Content.Files) {
                let subfile = await file.ToActualType();
                let buffer = await subfile.ToBuffer();

                expect(buffer).toBeInstanceOf(Buffer);

                let parsedFile = await SmileBASICFile.FromBuffer(buffer);
                expect(parsedFile).toBeInstanceOf(SmileBASICFile);
            }
        }
    });
    test(`${filename} to native type, ToBuffer is parsable and passes footer verification`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));
        let newFile = await file.ToActualType();
        let buffer = await newFile.ToBuffer();

        expect(buffer).toBeInstanceOf(Buffer);

        let parsedFile = await SmileBASICFile.FromBuffer(buffer, true);
        expect(parsedFile).toBeInstanceOf(SmileBASICFile);

        if (newFile instanceof SmileBASIC3ProjectFile || newFile instanceof SmileBASIC4ProjectFile) {
            for (let [ name, file ] of newFile.Content.Files) {
                let subfile = await file.ToActualType();
                if (subfile.Type !== SmileBASICFileType.Meta) {
                    let buffer = await subfile.ToBuffer();

                    expect(buffer).toBeInstanceOf(Buffer);

                    let parsedFile = await SmileBASICFile.FromBuffer(buffer, true);
                    expect(parsedFile).toBeInstanceOf(SmileBASICFile);
                }
            }
        }
    });
}
