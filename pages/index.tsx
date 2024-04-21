import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb";
import { GetStaticProps } from "next";
import { useEffect, useMemo, useState } from "react";

interface Word {
  _id: ObjectId;
  date: string;
  phrase: string;
  uniquekey: string;
}

interface TopProps {
  data: Word[];
}
interface Guess {
  word: string;
  time: number;
  winner?: boolean;
}

const bgColours = [
  "bg-lime-500",
  "bg-lime-400",
  "bg-lime-300",
  "bg-lime-200",
  "bg-lime-100",
  "bg-yellow-100",
  "bg-yellow-200",
  "bg-yellow-300",
  "bg-yellow-400",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-orange-400",
  "bg-orange-300",
  "bg-orange-200",
  "bg-orange-100",
  "bg-rose-100",
  "bg-rose-200",
  "bg-rose-300",
  "bg-rose-400",
  "bg-rose-500",
  "bg-rose-600",
  "bg-rose-700",
  "bg-rose-800",
  "bg-rose-900",
];

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

export default function Home({ data }: TopProps) {
  const [word, setWord] = useState("");
  const [hints, setHints] = useState(0);
  const [lastHour, setLastHour] = useState(0);
  const [victory, setVictory] = useState<boolean | string>(false);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);

  // async function fetchData(hour: number) {
  //   const response = await fetch(`/api?hour=${hour}`, {
  //     method: "GET",
  //   });
  //   const data = await response.json();
  //   setData(data);
  // }

  useEffect(() => {
    if (localStorage.getItem("won") !== null) {
      setVictory(localStorage.getItem("won") || "");
      const g = localStorage
        .getItem("guesses")
        ?.split(",")
        .map((guess) => {
          const [word, time, winner] = guess.split("?");
          return { word, time: parseInt(time), winner: winner === "WIN" };
        });
      setGuesses(g || []);
    }
  }, []);

  useMemo(() => {
    if (data && data.length) {
      setCurrentPhrase(data[0].phrase);
      setLastHour(new Date().getHours());
    }
  }, [data]);

  useMemo(() => {
    try {
        if (localStorage && guesses.length > 0) {
            localStorage.setItem("guesses", guesses.map((guess) => `${guess.word}?${guess.time}?${guess.winner ? "WIN" : "LOSE"}`).join(","));
        }
      } catch (error) {
        console.error(error);
      }
    
  }, [guesses]);

  const setInputWord = (e: React.ChangeEvent<HTMLInputElement>) => setWord(e.target.value);

  const handleGuess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (victory == false) {
      if (word.toLocaleLowerCase() === atob(data[0].uniquekey)) {
        setVictory(word.toLocaleLowerCase());
        setGuesses([...guesses, { word, time: Date.now(), winner: true }]);
        localStorage.setItem("won", atob(data[0].uniquekey));
      } else {
        setGuesses([...guesses, { word, time: Date.now() }]);
      }

      setWord("");
    }
  };

  const handleHint = () => {
    if (lastHour <= data[0].phrase.length - 5) {
      setHints((hint) => hint + 1);
      setLastHour((last) => last + 1);
    }
  };

  const getGuessColour = (time: number) => {
    const elapsed = new Date(time).getHours();
    return bgColours[elapsed];
  };

  const generateCopy = () => {
    const message = `🎩 Reveal-o\n I guessed the answer at ${new Date(guesses?.at(guesses.length - 1)?.time || "").toLocaleString()} in ${guesses.length} guess${guesses.length > 1 ? "es" : ""} with ${hints} hint${hints > 1 ? "s" : ""}!`;
    navigator.clipboard.writeText(message);
  };

  return (
    <main className="flex font-mono min-h-screen flex-col items-center justify-left p-24">
      <button className="lg:ml-4 p-3 place-self-start bg-slate-700" disabled={victory != false || (data && data.length ? lastHour <= data[0].phrase.length - 5 : false)} onClick={handleHint}>
        {data && data.length && lastHour <= data[0].phrase.length - 5 ? "No more hints!" : "Hint"}
      </button>

      <div className="z-10 w-full max-w-5xl text-sm text-center mb-3">
        <h1 className="text-3xl">Reveal-o</h1>
        <p>Guess the phrase as fast as you can :)</p>
      </div>
      <p className="mb-5">{currentPhrase}</p>

      {victory && (
        <div className="w-8/12 p-3 flex flex-col text-center items-center justify-center bg-green-100 text-black mb-5">
          <p className="text-2xl">You won!</p>
          <p>
            Your winning guess was at
            <br /> {new Date(guesses?.at(guesses.length - 1)?.time || "").toLocaleString()}
          </p>
          <p>The phrase was &quot;{victory}&quot;</p>
          <button onClick={generateCopy} className="bg-green-500 p-2 mt-3">
            Copy Results to Clipboard
          </button>
        </div>
      )}

      <div className="w-full flex flex-row justify-center">
        <form onSubmit={handleGuess} className="w-full md:w-8/12 flex flex-col lg:flex-row justify-center">
          <input className="text-black p-3 w-full" value={word} onChange={setInputWord} />

          <br />
          <button className="lg:ml-4 p-3 bg-slate-700" disabled={word.length === 0 || victory != false}>
            Submit
          </button>
        </form>
      </div>

      {guesses.map((guess, index) => (
        <div key={index} className={`flex flex-row justify-between w-8/12 p-3 mt-4 ${guess.winner ? "bg-green-600" : getGuessColour(guess.time)}`}>
          <p>{guess.word}</p>
          <p>{new Date(guess.time).toLocaleString().substring(11)}</p>
        </div>
      ))}
    </main>
  );
}

export const getStaticProps: GetStaticProps<TopProps> = async () => {
  try {
    const today = new Date();
    const client = await clientPromise;
    const db = client.db("daily-words");
    const word = await db
      .collection("answers")
      .find({
        $expr: {
          $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }, { $dateToString: { format: "%Y-%m-%d", date: today } }],
        },
      })
      .limit(10)
      .toArray();

    word[0].uniquekey = btoa(word[0].phrase);
    word[0].phrase = hideLetters(word[0].phrase, Math.min(today.getHours(), word[0].phrase.length - 5));

    return {
      props: { data: JSON.parse(JSON.stringify(word)) },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { data: [] },
    };
  }
};
