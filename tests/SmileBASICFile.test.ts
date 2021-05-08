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
        let buffer = await file.ToBuffer();

        expect(buffer).toBeInstanceOf(Buffer);
        let newFile = await SmileBASICFile.FromBuffer(buffer);

        expect(newFile).toBeInstanceOf(SmileBASICFile);
        expect(newFile.RawContent.equals(file.RawContent)).toBeTruthy();
    });
    test(`${filename} can be parsed to the native format`, async () => {
        let file = await SmileBASICFile.FromBuffer(fs.readFileSync(path.join(__dirname, "example_binaries", filename)));
        let newFile;

        switch (file.Type) {
            case SmileBASICFileType.Text:
                newFile = await file.AsTextFile();
                expect(newFile).toBeInstanceOf(SmileBASICTextFile);
                break;
            case SmileBASICFileType.Data:
                newFile = await file.AsDataFile();
                expect(newFile).toBeInstanceOf(SmileBASICDataFile);
                break;
            case SmileBASICFileType.Project3:
                newFile = await file.AsProject3File();
                expect(newFile).toBeInstanceOf(SmileBASIC3ProjectFile);
                break;
            case SmileBASICFileType.Project4:
                newFile = await file.AsProject4File();
                expect(newFile).toBeInstanceOf(SmileBASIC4ProjectFile);
                break;
            case SmileBASICFileType.Meta:
                newFile = await file.AsMetaFile();
                expect(newFile).toBeInstanceOf(SmileBASICMetaFile);
                break;

        }
    });
}
