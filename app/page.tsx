import { Hero } from "@/components/Hero";
import { Leistungen } from "@/components/Leistungen";
import { Ablauf } from "@/components/Ablauf";
import { Portfolio } from "@/components/Portfolio";
import { Preise } from "@/components/Preise";
import { Stimmen } from "@/components/Stimmen";
import { FAQ } from "@/components/FAQ";
import { Kontakt } from "@/components/Kontakt";

export default function Home() {
  return (
    <>
      <Hero />
      <Leistungen />
      <Ablauf />
      <Portfolio />
      <Preise />
      <Stimmen />
      <FAQ />
      <Kontakt />
    </>
  );
}
