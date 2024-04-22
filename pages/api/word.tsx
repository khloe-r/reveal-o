import clientPromise from "../../lib/mongodb";
import { NextApiRequest, NextApiResponse } from "next";

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

    res.json({ word: { message: "haha nice try :)" } });
  } catch (e) {
    res.json({ error: e });
  }
};
