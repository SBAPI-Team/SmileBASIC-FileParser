SmileBASIC File Format Specification
===

This is a reiteration of the [SmileBASIC file format page](https://old.smilebasicsource.com/page?pid=652) originally available on SmileBASIC Source.

There are a few differences:

1. Offsets are no longer used, as everything should honestly be calculated by the length of each element
2. Byte size is no longer used; each value has a "type" that is reused across multiple format specifications

Additional notes:
- All data in SmileBASIC files should be read as little-endian. 

# Types

## FileVersion
- **Type**: UInt16 (2 bytes)
- **Description**: Specifies the file format version of a SmileBASIC file.
- **Valid Values**:
  - `0-3`: SmileBASIC 3 format (3DS, Wii U)
  - `4`: SmileBASIC 4 format (Switch)

## FileType
- **Type**: UInt16 (2 bytes)
- **Description**: Specifies the type of content that this file holds.
- **Valid Values**:
    - `FileVersion = SB3`:
        - `0`: TXT (Text file, stores text in UTF-16 format.)
        - `1`: DAT (Data file, stores number data of a specific type.)
        - `2`: PRJ (Project archive, stores multiple files contained within a project. This is only used for uploading/download projects from SmileBASIC's servers.)
    - `FileVersion = SB4`:
        - `0`: TXT (Text file, stores text in UTF-16 format.)
        - `1`: DAT (Data file, stores number data of a specific type.)
        - `2`: GRP (Graphics file, same as DAT but should be read as containing image data as RGBA8888.)
        - `3`: PRJ (Project archive, stores multiple files contained within a project. This is only used for uploading/download projects from SmileBASIC's servers.)
        <br>
        **NOTE**: The format for SmileBASIC 4's projects is slightly different. I go into detail about that below.
        - `4`: META (Project metadata, stores information about a project including its name, a description, and the icon used in the project explorer.)

## DateTime
- **Type**: 1 UInt16 (2 bytes), followed by 5 UInt8s (1 byte), for a total size of 7 bytes
- **Description**: Stores a DateTime, without a timezone offset.
- **Valid Values**: There is no bounds checking in SmileBASIC for dates, but the below is what you should expect in a DateTime.
    - `Year`: 16 bits, 2014 to 2100
    - `Month`: 8 bits, 1 to 12
    - `Day`: 8 bits, 1 to 31
    - `Hour`: 8 bits, 0 to 23
    - `Minute`: 8 bits, 0 to 59
    - `Second`: 8 bits, 0 to 59



# Header

|Type        | Description                                           |
|------------|:------------------------------------------------------|
|FileVersion | See type description                                  |
|FileType    | See type description                                  |
|UInt16      | If bit 0 is set to 1, the content is zlib compressed. |
|UInt8       | The icon used. Valid values depend on the file type.  |
|UInt32      | The size of the file. Shown in the file browser.<br/> It may not always properly reflect the true file size.|
|