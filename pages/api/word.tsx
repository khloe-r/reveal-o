import clientPromise from "../../lib/mongodb";
import { NextApiRequest, NextApiResponse } from "next";

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const hideLetters = (phrase: string, hour: number) => {
  const len = phrase.length;

  let result = "";

  for (let i = 0; i < hour && i < len; i++) {
    result += phrase[i];
  }

  const nonSpaceCharacters = phrase
    .substring(hour)
    .split("")
    .filter((char) => char !== " ");
  const shuffledCharacters = shuffleArray(nonSpaceCharacters);

  for (let i = hour; i < len; i++) {
    if (phrase[i] === " ") {
      result += " ";
    } else {
      result += shuffledCharacters.shift() || "_";
    }
  }

  return result;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const today = new Date();
    const client = await clientPromise;
    const db = client.db("daily-words");
    const word = await db.collection("answers").findOne({
      $expr: {
        $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }, { $dateToString: { format: "%Y-%m-%d", date: today } }],
      },
    });

    db.collection("answers").updateOne(
      { _id: word?._id },
      {
        $inc: {
          count: 1,
        },
      }
    );

    res.json({ word });
  } catch (e) {
    res.json({ error: e });
  }
};
