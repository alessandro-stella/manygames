import Link from "next/link";
import { GameDetails } from "./types";

export default function GameCard({
  title,
  description,
  img,
  link,
}: GameDetails) {
  return (
    <Link
      href={link}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
    >
      <img src={img} alt={title} />
      <h3>{title}</h3>
      <p>{description}</p>
    </Link>
  );
}
