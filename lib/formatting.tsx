/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Text } from "ink";
import React from "react";
import { unstyle } from "ansi-colors";

export enum IrcFormatting {
    "\u0002" = "bold",
    "\u001D" = "italic",
    "\u001F" = "underline",
    "\u001E" = "strikethrough",
    "\u0003" = "color",
    "\u0016" = "inverse",
    "\u000F" = "reset",
}

export const IrcColors = [
    15, 0, 4, 2, 9, 1, 5, 3, 11, 10, 6, 14, 12, 13, 8, 7, 52, 94, 100, 58, 22,
    29, 23, 24, 17, 54, 53, 89, 88, 130, 142, 64, 28, 35, 30, 25, 18, 91, 90,
    125, 124, 166, 184, 106, 34, 49, 37, 33, 19, 129, 127, 161, 196, 208, 226,
    154, 46, 86, 51, 75, 21, 171, 201, 198, 203, 215, 227, 191, 83, 122, 87,
    111, 63, 177, 207, 205, 217, 223, 229, 193, 157, 158, 159, 153, 147, 183,
    219, 212, 16, 233, 235, 237, 239, 241, 244, 247, 250, 254, 231,
];

type Element = {
    text: string;
    color: string;
    backgroundColor: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    inverse: boolean;
};

type BooleanFormat =
    | "bold"
    | "italic"
    | "underline"
    | "strikethrough"
    | "inverse";

type IrcFormatCode = keyof typeof IrcFormatting;

const Digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function elementToJsx(element: Element, key: number) {
    return (
        <Text
            key={key}
            color={element.color}
            backgroundColor={element.backgroundColor}
            bold={element.bold}
            italic={element.strikethrough}
            underline={element.underline}
            strikethrough={element.strikethrough}
            inverse={element.inverse}
        >
            {element.text}
        </Text>
    );
}

// This function is very complex but I can't think of how to implement it
// any better.
// eslint-disable-next-line complexity
export function stringToFormattedText(text: string): React.JSX.Element {
    // Remove ANSI color codes from the text
    text = unstyle(text);
    // We don't support 0x11 (monospace)
    text = text.replaceAll("\u0011", "");
    // Alright, now let's parse the text
    const elements: React.JSX.Element[] = [];
    const currentElement = {
        text: "",
        color: "",
        backgroundColor: "",
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        inverse: false,
    };
    for (let i = 0; i < text.length; i++) {
        if (text[i]! in IrcFormatting) {
            // This switch is actually exhaustive, but linter doesn't know
            // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
            switch (IrcFormatting[text[i]! as IrcFormatCode]) {
                case "color": {
                    let color: string | undefined;
                    let backgroundColor: string | undefined;
                    let colorCode = "";
                    let backgroundColorCode = "";

                    if (text[i + 1]! in Digits) {
                        i++;
                        colorCode += text[i];
                    }

                    if (colorCode && text[i + 1]! in Digits) {
                        i++;
                        colorCode += text[i];
                    }

                    if (Number(colorCode) < 99)
                        color = `ansi256(${IrcColors[Number(colorCode)]})`;
                    else if (Number(colorCode) === 99)
                        color = "";

                    if (
                        color &&
                        text[i + 1] === "," &&
                        text[i + 2]! in Digits
                    ) {
                        i += 2;
                        backgroundColorCode += text[i];
                    }

                    if (backgroundColorCode && text[i + 1]! in Digits) {
                        i++;
                        backgroundColorCode += text[i];
                    }

                    if (Number(backgroundColorCode) < 99)
                        backgroundColor = `ansi256(${IrcColors[Number(backgroundColorCode)]})`;
                    else if (Number(backgroundColorCode) === 99)
                        backgroundColor = "";

                    if (currentElement.text) {
                        elements.push(
                            elementToJsx(currentElement, elements.length),
                        );
                        currentElement.text = "";
                    }

                    if (color === undefined) {
                        currentElement.color = "";
                        currentElement.backgroundColor = "";
                    } else {
                        currentElement.color = color;
                        currentElement.backgroundColor =
                            backgroundColor ?? currentElement.backgroundColor;
                    }

                    break;
                }

                case "bold":
                case "italic":
                case "underline":
                case "strikethrough":
                case "inverse": {
                    if (currentElement.text) {
                        elements.push(
                            elementToJsx(currentElement, elements.length),
                        );
                        currentElement.text = "";
                    }

                    currentElement[
                        IrcFormatting[
                            text[i]! as IrcFormatCode
                        ] as BooleanFormat
                    ] =
                        !currentElement[
                            IrcFormatting[
                                text[i]! as IrcFormatCode
                            ] as BooleanFormat
                        ];

                    break;
                }

                case "reset": {
                    if (currentElement.text) {
                        elements.push(
                            elementToJsx(currentElement, elements.length),
                        );
                        currentElement.text = "";
                    }

                    currentElement.color = "";
                    currentElement.backgroundColor = "";
                    currentElement.bold = false;
                    currentElement.italic = false;
                    currentElement.underline = false;
                    currentElement.strikethrough = false;
                    currentElement.inverse = false;
                    break;
                }

                default: {
                    // This shouldn't happen.
                    throw new Error("Something's gone really wrong here.");
                }
            }
        } else {
            currentElement.text += text[i];
        }
    }

    if (currentElement.text)
        elements.push(elementToJsx(currentElement, elements.length));

    return elements.length === 1 ? elements[0]! : <Text>{elements}</Text>;
}
