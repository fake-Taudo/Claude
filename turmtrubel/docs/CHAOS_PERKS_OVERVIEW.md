# Chaos-Modus: Perk-Übersicht

40 Karten × 3 Stufen = 120 Perks. Vollständige Parameter in `data/chaos_perks.json`. Erzeugt mit `node tools/chaos/perks.mjs overview`.

Herkunft: 26 aus den Vorschlägen gewählt, 94 eigene Ideen aus dem Interview, 0 automatisch gewählt.

Seltenheitsfarben im Spiel: Gewöhnlich = Grau, Selten = Bronze, Episch = Lila.

## 1. Riese (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Sturmlauf** | Der Riese läuft doppelt so schnell: 0,75 → 1,5 Felder pro Sekunde. | Werte | eigene Idee |
| Selten | **Turmschüttler** | Jeder Schlag des Riesen betäubt das getroffene Gebäude 0,5 Sekunden und setzt dessen Angriff zurück. | Neue Fähigkeit | Vorschlag |
| Episch | **Bruchlandung** | Der Riese erscheint mit Flügeln und fliegt; beim ersten eigenen Angriff oder ersten erlittenen Treffer stürzt er ab und löst eine Explosion aus: 450 Schaden mit Rückstoß 1,5 an Bodenzielen und Gebäuden im Umkreis von 3 Feldern. | Verhalten | eigene Idee |

## 2. P.E.K.K.A. (7 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Raketenstiefel** | Die P.E.K.K.A. läuft doppelt so schnell: 0,75 → 1,5 Felder pro Sekunde. | Werte | eigene Idee |
| Selten | **Schwungschlag** | Jeder Schlag trifft alle Bodentruppen und Gebäude im Umkreis von 1,5 Feldern um das Ziel statt nur ein Ziel. | Verhalten | Vorschlag |
| Episch | **Tiefenläuferin** | Die P.E.K.K.A. lässt sich wie der Tunnelgräber überall in der Arena platzieren (außer im Fluss und auf Gebäuden), auch direkt an gegnerischen Türmen; ihr Turmschaden bleibt unverändert. | Verhalten | eigene Idee |

## 3. Megaritter (7 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Heavy Hitter** | Der Landestoß beim Platzieren macht doppelt so viel Schaden: 430 → 860 (Radius 2,2, Rückstoß unverändert). | Werte | eigene Idee |
| Selten | **Springer Bube** | Statt normaler Schläge springt der Megaritter bei jedem Angriff auf sein Ziel (0–5 Felder Entfernung, auch direkt vor ihm) und macht 537 Flächenschaden mit Rückstoß; 0,3 s nach jeder Landung folgt der nächste Sprung. | Verhalten | eigene Idee |
| Episch | **Himmelfahrt** | Jede Bodentruppe, die der Megaritter trifft (Schlag, Sprung oder Landestoß), wird in die Luft geschleudert und sofort aus der Arena entfernt – ohne Todeseffekte; Gebäude und Türme nehmen normalen Schaden. | Neue Fähigkeit | eigene Idee |

## 4. Golem (8 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Bergkoloss** | Der Golem hat doppelt so viel Leben (5120 → 10240), läuft dafür nur halb so schnell (0,75 → 0,375 Felder pro Sekunde). | Werte | eigene Idee |
| Selten | **Golemit-Kaskade** | Beim Tod entstehen wie gewohnt 2 Golemiten, die beim eigenen Tod jeweils noch einmal in 2 Golemiten zerfallen (6 Golemiten insgesamt; die zweite Generation teilt sich nicht weiter). | Spawn | eigene Idee |
| Episch | **Doppelgolem** | Beim Tod erscheinen statt der 2 Golemiten 2 normale Golems (je 5120 Leben, ohne Perk), die beim eigenen Tod normal in je 2 Golemiten zerfallen; die Todesexplosion bleibt. | Spawn | eigene Idee |

## 5. Ritter (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Bollwerk** | Der Ritter hat dreimal so viel Leben (1766 → 5298, +200 %), läuft dafür nur halb so schnell (1 → 0,5 Felder pro Sekunde). | Werte | eigene Idee |
| Selten | **Donnerklinge** | Jeder Treffer des Ritters löst am Ziel einen Knall aus (192 Schaden, 0,5 s Betäubung, Radius 2,5 Felder, an Türmen 30 % Schaden). | Neue Fähigkeit | eigene Idee |
| Episch | **Beförderung** | Beim Ausspielen erscheint statt des Ritters ein normaler Megaritter (3993 Leben, Landestoß 430, Sprungangriff) – für weiterhin 3 Elixier und ohne Megaritter-Perk. | Spawn | eigene Idee |

## 6. Banditin (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Weitsprint** | Die Sprintreichweite verdoppelt sich: Sie sprintet auf Ziele in 3,5–12 statt 3,5–6 Feldern Entfernung (Sprintschaden unverändert 389). | Werte | eigene Idee |
| Selten | **Letzter Sprint** | Ein tödlicher Treffer tötet sie nicht sofort: Sie wird 1,5 Sekunden unverwundbar, sprintet ein letztes Mal ohne Mindestabstand auf das nächste Ziel in bis zu 6 Feldern (389 Schaden) und fällt danach. | Neue Fähigkeit | eigene Idee |
| Episch | **Schattenbande** | Bei jedem Sprint erscheint für jeden weiteren Gegner in Sprintreichweite (3,5–6 Felder) ein Banditinnen-Klon mit 1 Leben, der genau dieses Ziel ansprintet (389 Schaden) und danach weiterkämpft; höchstens 4 Klone pro Sprint, Klone erzeugen keine weiteren Klone. | Spawn | eigene Idee |

## 7. Walküre (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Riesenschwung** | Der Rundumschlag reicht 150 % weiter: Radius 2 → 5 Felder (Schaden unverändert 266). | Werte | eigene Idee |
| Selten | **Sogwirbel** | Jeder Schlag zieht alle gegnerischen Bodentruppen im Umkreis von 4 Feldern 1 Feld zu ihr heran. | Neue Fähigkeit | Vorschlag |
| Episch | **Wirbelsturm** | Die Walküre läuft dreimal so schnell (1 → 3 Felder pro Sekunde, +200 %) und schlägt ununterbrochen zu, auch im Laufen: alle 1,5 s ein Rundumschlag mit 266 Schaden; an Zielen bleibt sie wie gewohnt stehen. | Verhalten | eigene Idee |

## 8. Mini-P.E.K.K.A. (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Luftpost-Lieferung** | Der Mini-P.E.K.K.A. kommt wie die Königliche Luftpost vom Himmel: 3 s nach dem Platzieren (eigene Spielhälfte) landet er mit 384 Schaden im Umkreis von 3 Feldern (kein Turmschaden) und kämpft dann normal. | Verhalten | eigene Idee |
| Selten | **Zwillinge** | Es kommen 2 Mini-P.E.K.K.A. mit je 55 % Leben (765) und vollem Schaden (755). | Spawn | Vorschlag |
| Episch | **Super-Mini-P.E.K.K.A.** | Der Mini-P.E.K.K.A. läuft doppelt so schnell (1,5 → 3 Felder pro Sekunde) und hat 250 % mehr Leben (1390 → 4865). | Werte | eigene Idee |

## 9. Prinz (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Sturmlanze** | Der Ansturm macht 75 % mehr Schaden: 783 → 1370. | Werte | eigene Idee |
| Selten | **Turnierreiter** | Nach jedem Treffer weicht der Prinz 2 Felder zurück und stürmt erneut an, sodass jeder Schlag ein Ansturm wird (783 Schaden); jeder Ansturmtreffer schleudert das Ziel 3 Felder zurück und betäubt es 1 Sekunde. | Verhalten | eigene Idee |
| Episch | **Unaufhaltsam** | Der Prinz greift nur noch Kronentürme an, ist ab dem Landen dauerhaft im Ansturm und schiebt alles in seinem Weg 3 Felder zur Seite; Betäubung, Verlangsamung, Einfrieren, Rückstoß und Sog wirken nicht auf ihn – nur sein Tod stoppt ihn. | Verhalten | eigene Idee |

## 10. Bomber (2 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Panzerweste** | Der Bomber hat 300 % mehr Leben: 304 → 1216. | Werte | eigene Idee |
| Selten | **Springbombe** | Jede Bombe hüpft nach dem Einschlag noch 2-mal je 3 Felder in Wurfrichtung weiter und explodiert jedes Mal erneut (je 212 Schaden, Radius 1,5). | Neue Fähigkeit | Vorschlag |
| Episch | **Megabombe** | Jeder Wurf ist eine Bombe wie die des Riesenskeletts: Sie bleibt liegen und explodiert nach 3 Sekunden mit 688 Schaden (an Türmen doppelt: 1376) und Rückstoß 1,5 im Umkreis von 3 Feldern. | Verhalten | eigene Idee |

## 11. Bogenschützen (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Fernsicht** | Die Bogenschützinnen schießen 150 % weiter: Reichweite 5 → 12,5 Felder (Sichtweite ebenso). | Werte | eigene Idee |
| Selten | **Magieschützen-Pfeile** | Jeder Pfeil fliegt wie beim Magieschützen 11 Felder weit durch alle Gegner in der Linie (Breite 0,5) und trifft jeden mit 112 Schaden. | Verhalten | eigene Idee |
| Episch | **Schützenkompanie** | Es kommen 5 Bogenschützinnen statt 2, jede mit vollen Werten (304 Leben, 112 Schaden). | Spawn | Vorschlag |

## 12. Musketierin (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Schnellfeuer** | Die Musketierin lädt doppelt so schnell nach: ein Schuss alle 0,5 s statt alle 1 s (217 Schaden pro Schuss). | Werte | eigene Idee |
| Selten | **Kanonenkugel** | Sie schießt eine doppelt so große, halb so schnelle Kugel (16,7 → 8,3 Felder/s), die getroffene Truppen 1,5 Felder zurückdrückt (Schaden unverändert 217). | Verhalten | eigene Idee |
| Episch | **Nachschub** | Für jede gegnerische Truppe, die sie besiegt, erscheint neben ihr eine weitere vollwertige Musketierin (721 Leben, 217 Schaden, ohne Perk); höchstens 4 zusätzliche pro Ausspielen, Gebäude und Türme zählen nicht. | Spawn | eigene Idee |

## 13. Elektromagier (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Dreifachblitz** | Der Elektromagier trifft 3 statt 2 Ziele gleichzeitig (je 115 Schaden und 0,5 s Betäubung). | Werte | Vorschlag |
| Selten | **Dauerblitz** | Statt einzelner Blitze hält er einen Dauerstrahl auf bis zu 2 Ziele: 80 Schaden pro Sekunde je Ziel, dazu wie gewohnt alle 1,8 s eine Betäubung von 0,5 s. | Verhalten | eigene Idee |
| Episch | **Blitzherr** | Statt der normalen Attacke wirkt er alle 1,8 s den Blitz-Zauber auf sein Ziel: 3 Einschläge auf die Gegner mit den meisten Leben im Umkreis von 3,5 Feldern, je 1057 Schaden (an Türmen 27 %) und 0,5 s Betäubung. | Verhalten | eigene Idee |

## 14. Goblin Demolisher (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Weitwerfer** | Er wirft sein Dynamit 150 % weiter: Reichweite 5 → 12,5 Felder (Sichtweite ebenso). | Werte | eigene Idee |
| Selten | **Zündkette** | Beim Verwandeln in den Kamikaze (bei 50 % Leben) explodiert er sofort einmal mit 404 Schaden und Rückstoß im Umkreis von 2,5 Feldern und rennt danach trotzdem los. | Neue Fähigkeit | Vorschlag |
| Episch | **Dauerfeuerwerk** | Er wirft sechsmal so schnell (+500 % Angriffsgeschwindigkeit): eine Dynamitstange alle 0,2 s statt alle 1,2 s (je 186 Flächenschaden); die Kamikaze-Form bleibt unverändert. | Werte | eigene Idee |

## 15. Magier (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Großbrand** | Seine Feuerbälle explodieren doppelt so weit: Explosionsradius 1,5 → 3 Felder (Schaden unverändert 304). | Werte | eigene Idee |
| Selten | **Feuerballwerfer** | Jede Attacke ist ein Feuerball-Zauber auf sein Ziel (688 Schaden, Radius 2,5, Rückstoß, an Türmen 23 %) im normalen Takt alle 1,4 s. | Verhalten | eigene Idee |
| Episch | **Magier-Trio** | Mit dem Magier erscheinen ein Eismagier (688 Leben, verlangsamt) und ein Elektromagier (714 Leben, betäubt) – alle drei mit normalen Werten, die Begleiter ohne Perk. | Spawn | eigene Idee |

## 16. Hexe (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Doppelritual** | Die Hexe beschwört doppelt so oft: alle 3,5 s statt alle 7 s je 4 Skelette. | Spawn | eigene Idee |
| Selten | **Wächterkreis** | Statt 4 Skeletten beschwört sie alle 7 s 4 Wächter (81 Leben + 256 Schild, 117 Schaden, Reichweite 1,6). | Spawn | eigene Idee |
| Episch | **Evo-Beschwörung** | Sie beschwört alle 7 s 4 Evo-Skelette, die bei jedem Angriff ein weiteres Evo-Skelett erzeugen (bis zu 8 pro Beschwörung) – auch wenn Evolutionen im Chaos-Modus sonst aus sind. | Spawn | eigene Idee |

## 17. Fledermäuse (2 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Blutdurst** | Jeder Biss heilt die Fledermaus um 40 Leben (höchstens bis zu ihren vollen 81 Leben). | Neue Fähigkeit | Vorschlag |
| Selten | **Teilung** | Jede sterbende Fledermaus zerfällt einmal in 2 Mini-Fledermäuse mit je 40 Leben und 40 Schaden, die sich nicht weiter teilen. | Spawn | Vorschlag |
| Episch | **Explosionsbisse** | Jeder Biss explodiert und trifft alle Gegner im Umkreis von 1,5 Feldern (Boden und Luft) mit 100 Schaden statt 81 an einem einzelnen Ziel. | Verhalten | eigene Idee |

## 18. Lakaien (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Vierter Lakai** | Es kommen 4 statt 3 Lakaien, jeder mit vollen Werten (230 Leben, 107 Schaden). | Spawn | Vorschlag |
| Selten | **Schockbiss** | Jeder Treffer eines Lakaien betäubt das Ziel 0,5 Sekunden. | Neue Fähigkeit | eigene Idee |
| Episch | **Megastaffel** | Statt der 3 Lakaien erscheinen 3 Megalakaien (je 837 Leben, 312 Schaden alle 1,5 s, fliegen, Boden & Luft). | Spawn | eigene Idee |

## 19. Koboldgang (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Großfamilie** | Je 2 Kobolde und 2 Speerkobolde mehr: 5 Kobolde und 5 Speerkobolde statt je 3. | Spawn | eigene Idee |
| Selten | **Giftspeere** | Statt der gemischten Gang kommen 6 Speerkobolde, deren Speere wie beim Evo-Blasrohrkobold vergiften: Gift im Radius 1,5, das mit jedem Treffer auf dasselbe Ziel stärker wird (nach 1/4/7 Treffern 51/115/307 Schaden pro Sekunde, an Türmen 25 %). | Spawn | eigene Idee |
| Episch | **Riesenbande** | Statt der Gang erscheinen 1 Koboldriese (3022 Leben, greift Gebäude an, 2 Speerkobolde auf dem Rücken) und 2 Blasrohrkobolde (je 261 Leben, 156 Schaden, Reichweite 6,5) mit normalen Werten. | Spawn | eigene Idee |

## 20. Skelettarmee (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Knochenschilde** | Jedes der 15 Skelette trägt einen Schild von 60 Punkten, der zuerst Schaden schluckt. | Werte | Vorschlag |
| Selten | **Schattenrückkehr** | Jedes Skelett steht nach seinem Tod einmal für 6 Sekunden unsichtbar wieder auf und greift weiter an; Truppen, Gebäude und Türme können es nicht anvisieren, Flächenschaden und Zauber treffen es aber. | Spawn | eigene Idee |
| Episch | **Knochenlotterie** | Statt 15 Skeletten erscheinen 15 zufällige Skelett-Einheiten aus allen Skelett-Typen des Spiels (Skelett, Wächter, Bomber, Mauerbrecher, Skelettdrache, Skelett-Fallschirmjäger, Riesenskelett, Skelettkönig ohne Fähigkeit, Grabkönigin) – schwere Einheiten selten und höchstens einmal. | Spawn | eigene Idee |

## 21. Barbaren (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Sechster Barbar** | Es kommen 6 statt 5 Barbaren, jeder mit vollen Werten (716 Leben, 192 Schaden). | Spawn | Vorschlag |
| Selten | **Stahlhaut** | Jeder Barbar hat doppelt so viel Leben: 716 → 1432. | Werte | eigene Idee |
| Episch | **Elitetrupp** | Statt der 5 Barbaren erscheinen 3 Elitebarbaren (je 1341 Leben, 384 Schaden alle 1,4 s, schnell). | Spawn | eigene Idee |

## 22. Eisgeist (1 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Frosttrio** | Es erscheinen 3 Eisgeister statt einem, jeder mit vollen Werten (110 Flächenschaden, 1,1 s Einfrieren). | Spawn | eigene Idee |
| Selten | **Schneesturm** | Beim Aufprall entsteht 7 Sekunden lang ein Schneesturm (Radius 2,5): Gegner, die hineinlaufen, frieren 1,1 s ein; wer darin bleibt, friert alle 2,5 s erneut ein. | Neue Fähigkeit | eigene Idee |
| Episch | **Gletscherkoloss** | Statt des Eisgeists erscheint ein riesiger Eisgolem mit viermal so viel Leben wie normal (1228 → 4912), der wie gewohnt Gebäude angreift und beim Tod Frost verteilt. | Spawn | eigene Idee |

## 23. Megalakai (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Bollwerkflügel** | Der Megalakai hat dreimal so viel Leben (+200 %): 837 → 2511. | Werte | eigene Idee |
| Selten | **Flammenatem** | Statt einzelner Schläge speit er einen Flammenkegel (3 Felder lang, 60° breit): 120 Schaden pro Sekunde und 30 % Verlangsamung an allen Gegnern darin, danach brennen sie 3 s lang mit 40 Schaden pro Sekunde nach. | Verhalten | eigene Idee |
| Episch | **Fernbomber** | Er greift aus sechsfacher Entfernung an (+500 % Reichweite: 1,6 → 9,6 Felder) und dreimal so schnell (+200 %: alle 0,5 s statt alle 1,5 s), Schaden je Treffer unverändert 312. | Werte | eigene Idee |

## 24. Drachenbaby (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Turbodrache** | Das Drachenbaby fliegt dreimal so schnell (+200 %): 1,5 → 4,5 Felder pro Sekunde. | Werte | eigene Idee |
| Selten | **Feuerspucker** | Jede Attacke ist ein Feuerball-Zauber auf sein Ziel (688 Schaden, Radius 2,5, Rückstoß, an Türmen 23 %) im normalen Takt alle 1,5 s. | Verhalten | eigene Idee |
| Episch | **Drachenei** | Beim Tod lässt das Drachenbaby ein Ei fallen, aus dem sofort eine zufällige Evo-Dracheneinheit schlüpft: Evo-Drachenbaby, Evo-Elektrodrache oder Evo-Infernodrache (je ein Drittel Chance, ohne Perk). | Spawn | eigene Idee |

## 25. Infernodrache (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Langer Strahl** | Der Strahl reicht doppelt so weit: Reichweite 3,5 → 7 Felder (Sichtweite ebenso). | Werte | eigene Idee |
| Selten | **Gespaltener Strahl** | Er hält zwei Strahlen gleichzeitig auf 2 verschiedene Ziele, jeder Strahl heizt sich eigenständig auf (35 → 120 → 422 Schaden). | Verhalten | Vorschlag |
| Episch | **Höllenfeuer-Evo** | Es erscheint ein Evo-Infernodrache (behält seine Strahlstufe bis 9 s nach einem Sieg, 4. Stufe mit 844 Schaden nach 20 s), und jeder Schaden, den er einer Truppe zufügt, trifft zur Hälfte auch alle anderen gegnerischen Truppen in der Arena (Gebäude und Türme ausgenommen). | Neue Fähigkeit | eigene Idee |

## 26. Schweinereiter (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Wildgalopp** | Der Schweinereiter läuft 75 % schneller: 2 → 3,5 Felder pro Sekunde. | Werte | eigene Idee |
| Selten | **Bohrhammer** | Statt des Hammers nutzt er einen Bohrer, der alle 0,4 s trifft und sich alle 2 s steigert (50 → 120 → 300 Schaden pro Treffer); Zielwechsel oder Betäubung setzen ihn zurück. | Verhalten | eigene Idee |
| Episch | **Ferkelflut** | Jeder Treffer gegen ein Gebäude lässt ein Ferkel frei (300 Leben, 80 Schaden, rennt zu Gebäuden) – ohne eigene Obergrenze, nur die allgemeine Einheitengrenze der Arena gilt. | Spawn | eigene Idee |

## 27. Rammbock (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Volle Besatzung** | Beim Zerbrechen steigen 4 statt 2 Barbaren aus (je 716 Leben, 192 Schaden). | Spawn | eigene Idee |
| Selten | **Elitebesatzung** | Beim Zerbrechen steigen 2 Elitebarbaren aus (je 1341 Leben, 384 Schaden, schnell) statt 2 normaler Barbaren. | Spawn | Vorschlag |
| Episch | **Doppelramme** | Es kommen 2 Rammböcke nebeneinander, jeder mit 2 Barbaren an Bord (zusammen 4 Barbaren). | Spawn | Vorschlag |

## 28. Ballon (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Bombenhagel** | Der Ballon wirft dreimal so schnell: eine Bombe (640 Schaden) alle 0,67 s statt alle 2 s. | Werte | eigene Idee |
| Selten | **Bombenspur** | Unterwegs wirft er alle 0,5 s eine kleine Bombe auf Bodentruppen unter sich: 150 Schaden im Radius 1,5. | Neue Fähigkeit | eigene Idee |
| Episch | **Luftschiff** | Der Ballon wird zum Luftschiff: doppelte Größe, 300 % mehr Leben (1679 → 6716) und 50 % mehr Schaden (640 → 960). | Werte | eigene Idee |

## 29. Königsriese (6 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Weitschuss** | Seine Kanone reicht 1,5 Felder weiter: Reichweite 5 → 6,5 Felder. | Werte | Vorschlag |
| Selten | **Kolossrüstung** | Der Königsriese hat dreimal so viel Leben (+200 %): 3164 → 9492. | Werte | eigene Idee |
| Episch | **Wandelndes Geschütz** | Seine Kanone reicht 11 Felder weit wie ein X-Bogen, er läuft trotzdem weiter, und er schießt 50 % schneller (alle 1,2 s statt alle 1,8 s, 307 Schaden). | Verhalten | eigene Idee |

## 30. Tesla (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Viererspule** | Die Tesla greift bis zu 4 Ziele gleichzeitig an, jedes mit vollem Schaden (220 alle 1,1 s). | Verhalten | eigene Idee |
| Selten | **Zermürbungsstrom** | Jeder Blitztreffer senkt die maximalen Leben und den Schaden des getroffenen Gegners dauerhaft um 10 % (stapelbar bis höchstens −70 %). | Neue Fähigkeit | eigene Idee |
| Episch | **Dr. Frankens Erbe** | Wird die Tesla zerstört oder läuft sie ab, erscheint Goblinstein: der Kobold-Doktor (721 Leben, Blitze gegen Boden & Luft) mit seinem Monster (2240 Leben, greift Gebäude an) – ohne Champion-Fähigkeit. | Spawn | eigene Idee |

## 31. Koboldhütte (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Speer-Doppelpack** | Die Hütte bringt jedes Mal 2 Speerkobolde statt einem (alle 2,2 s, sobald Gegner in 6 Feldern sind). | Spawn | Vorschlag |
| Selten | **Koboldpartyhütte** | Die Hütte wirft zusätzlich selbst Speere: 60 Schaden alle 0,5 s, Reichweite 8 Felder, gegen Boden und Luft. | Neue Fähigkeit | eigene Idee |
| Episch | **Demolisher-Werkstatt** | Statt Speerkobolden bringt die Hütte alle 2,2 s einen Goblin Demolisher (1300 Leben, 186 Flächenschaden, ohne Perk), sobald Gegner in 6 Feldern sind; beim Zerstören kommt ebenfalls ein Demolisher. | Spawn | eigene Idee |

## 32. Infernoturm (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Turbo-Glut** | Der Strahl heizt sich doppelt so schnell auf: Stufenwechsel alle 1 s statt alle 2 s (43 → 158 → 847 Schaden). | Werte | eigene Idee |
| Selten | **Dreifachstrahl** | Der Infernoturm hält drei Strahlen auf 3 Ziele gleichzeitig, jeder heizt sich eigenständig auf. | Verhalten | Vorschlag |
| Episch | **Weißglut** | Der Strahl startet sofort auf der Höchststufe (847 Schaden alle 0,4 s) und fällt auch nach Zielwechsel oder Betäubung nicht mehr zurück. | Verhalten | eigene Idee |

## 33. Knall (2 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Schwächungsknall** | Getroffene Gegner verlieren zusätzlich sofort 30 % ihrer aktuellen Leben und machen dauerhaft 50 % weniger Schaden (gilt für Truppen und Gebäude, nicht für Kronentürme). | Neue Fähigkeit | eigene Idee |
| Selten | **Blitznachschlag** | Zusätzlich schlägt ein Blitz wie beim Blitz-Zauber in die gegnerische Truppe mit den meisten Leben im Umkreis von 3,5 Feldern ein: 1057 Schaden und 0,5 s Betäubung. | Neue Fähigkeit | eigene Idee |
| Episch | **Knall-Kette** | 5 Knalle schlagen nacheinander in einer Linie ein – ab dem Zielpunkt Richtung Gegnerseite, je 2,5 Felder auseinander und 0,3 s versetzt – jeder mit 192 Schaden, 0,5 s Betäubung und Radius 2,5. | Neue Fähigkeit | eigene Idee |

## 34. Kampfholz (2 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Weitroller** | Der Stamm rollt doppelt so weit: 10,1 → 20,2 Felder (Schaden, Breite und Rückstoß unverändert). | Werte | eigene Idee |
| Selten | **Doppelstamm** | Es rollen 2 Stämme hintereinander im Abstand von 1 Sekunde, jeder mit 266 Schaden und Rückstoß. | Spawn | Vorschlag |
| Episch | **Holzfäller-Überraschung** | Wenn der Stamm ausgerollt ist, springt an seinem Ende ein Holzfäller heraus (1282 Leben, 256 Schaden, sehr schnell), der beim Tod wie gewohnt Wut hinterlässt. | Spawn | eigene Idee |

## 35. Pfeile (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Vierte Welle** | Es fallen 4 statt 3 Pfeilwellen (je 122 Schaden im Radius 3,5). | Werte | Vorschlag |
| Selten | **Feuerregen** | Statt Pfeilen regnen 3 Wellen kleiner Feuerbälle: je 150 Schaden im Radius 3,5 mit leichtem Rückstoß (0,4), Getroffene brennen 2 s lang mit 25 Schaden pro Sekunde. | Verhalten | eigene Idee |
| Episch | **Königin des Hagels** | Am Einschlagort erscheint zusätzlich eine Bogenschützen-Königin (1000 Leben, 232 Schaden, Reichweite 5, Boden & Luft) – ohne ihre Champion-Fähigkeit. | Spawn | eigene Idee |

## 36. Koboldfass (3 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Schnellwurf** | Das Fass fliegt 50 % schneller (Fluggeschwindigkeit 10 → 15 Felder pro Sekunde), dem Gegner bleibt weniger Zeit zum Reagieren. | Werte | Vorschlag |
| Selten | **Bombenfass** | Das Fass schlägt ein wie eine Rakete (1484 Schaden im Radius 2, Rückstoß, an Türmen 25 %) und lässt danach die 3 Kobolde frei. | Neue Fähigkeit | eigene Idee |
| Episch | **Riesenfass** | Statt der 3 Kobolde springt ein Koboldriese aus dem Fass (3022 Leben, greift Gebäude an, 2 Speerkobolde auf dem Rücken). | Spawn | Vorschlag |

## 37. Feuerball (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Glutboden** | Nach dem Einschlag brennt der Boden 3 Sekunden lang: 50 Schaden pro Sekunde an Gegnern im Radius 2,5. | Neue Fähigkeit | eigene Idee |
| Selten | **Tornado-Feuerball-Kombo** | Am Zielpunkt entsteht zuerst ein Tornado (Radius 5,5, zieht Gegner zusammen, wie der Tornado-Zauber), und währenddessen schlagen 3 Feuerbälle (je 688 Schaden, Radius 2,5) nach 0,4, 0,7 und 1,0 s in seine Mitte ein. | Neue Fähigkeit | eigene Idee |
| Episch | **Riesenfeuerball** | Ein riesiger Feuerball: 1000 Schaden im Radius 4, danach läuft eine Druckwelle bis 7 Felder weit (300 Schaden, 2 Felder Rückstoß); an Türmen jeweils 23 %. | Werte | eigene Idee |

## 38. Gift (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Lähmgift** | Gegner in der Giftwolke sind 50 % statt 15 % langsamer. | Werte | eigene Idee |
| Selten | **Dreifachgift** | Die Giftwolke macht dreimal so viel Schaden pro Sekunde: 92 → 276 (über 8 s zusammen 2208, an Türmen 24 %). | Werte | eigene Idee |
| Episch | **Würgegift** | Doppelter Schaden (184 pro Sekunde), doppelte Dauer (16 s) und doppelte Fläche (Radius 3,5 → 4,95), und jede Truppe, die die Wolke betritt, wird festgehalten (kann sich weder bewegen noch angreifen), bis das Gift vorbei ist – auch Flieger, Gebäude nicht. | Neue Fähigkeit | eigene Idee |

## 39. Goldener Ritter (4 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Gratis-Sprung** | Seine Fähigkeit „Schnellsprung“ kostet 0 statt 1 Elixier. | Werte | Vorschlag |
| Selten | **Klingenwirbel** | Er schlägt doppelt so schnell zu (+100 % Angriffsgeschwindigkeit): alle 0,45 s statt alle 0,9 s (161 Schaden pro Schlag). | Werte | eigene Idee |
| Episch | **Goldene Endloskette** | Die Sprungkette endet nicht nach 10 Sprüngen: Er springt weiter unverwundbar von Gegner zu Gegner (je 335 Schaden), bevorzugt Ziele Richtung nächstem gegnerischen Kronenturm und hört erst auf, wenn er am Turm landet oder kein Ziel mehr in 5,5 Feldern ist (technische Obergrenze 50 Sprünge). | Verhalten | eigene Idee |

## 40. Bowler (Held) (5 Elixier)

| Stufe | Perk | Wirkung | Art | Herkunft |
|---|---|---|---|---|
| Gewöhnlich | **Günstiger Wurf** | Die Heldenfähigkeit „Steinwurf“ kostet 1 statt 2 Elixier. | Werte | Vorschlag |
| Selten | **Felsenbrecher** | Normale Felsen rollen doppelt so weit (7 → 14 Felder) und stoßen getroffene Bodentruppen 2 statt 1 Feld zurück. | Verhalten | Vorschlag |
| Episch | **Sprengfels** | Jeder normale Fels explodiert, wo er aufschlägt: 289 Schaden im Radius 2, alle getroffenen Truppen fliegen 5 Felder zurück; danach rollt er wie gewohnt weiter. | Neue Fähigkeit | eigene Idee |
