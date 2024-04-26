"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import DOMPurify from "dompurify";

export function Chat() {
  const [keywords, setKeywords] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedEndDate, setSelectedEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleKeywordsChange = (event) => {
    setKeywords(event.target.value);
  };

  const handleStartDateChange = (event) => {
    setSelectedStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setSelectedEndDate(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    // Separa as palavras-chave por espaços e remove espaços extras.
    const keywordsArray = keywords.split(" ").filter((kw) => kw.trim() !== "");
    const formattedStartDate = selectedStartDate.split("-").join("");
    const formattedEndDate = selectedEndDate.split("-").join("");

	const allResultsPromises = keywordsArray.map(async (keyword) => {
      const url = `https://www.imprensaoficial.com.br/DO/BuscaDO2001Resultado_11_3.aspx?filtropalavraschave=${encodeURIComponent(keyword)}&filtrodatainiciosalvar=${formattedStartDate}&filtrodatafimsalvar=${formattedEndDate}&filtrotodosgrupos=True`;
      const response = await fetch(url);
      const text = await response.text();

      return {
        keyword,
        text,
      };
    });

    try {
      const allResults = await Promise.all(allResultsPromises);

      const parsedResults = allResults.map((result) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(result.text, "text/html");
        const cards = doc.querySelectorAll(".resultadoBuscaItem");

        const cleanedCards = Array.from(cards).map((card) => {
          const header = card.querySelector(".card-header").innerHTML;
          const body = card.querySelector(".card-body").innerHTML;

          return {
            header: DOMPurify.sanitize(header),
            body: DOMPurify.sanitize(body),
          };
        });

        return {
          keyword: result.keyword,
          cards: cleanedCards,
        };
      });

      setResults(parsedResults);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
      console.log("Finished fetching results: ", results);
    }
  };
  return (
    <>
      <Card className="w-[800px]">
        <CardHeader>
          <CardTitle>Smart chat</CardTitle>
          <CardDescription>
            Use os inputs abaixo para procurar por informações e selecionar o
            intervalo de datas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-2 w-full mb-6"
            onSubmit={handleSubmit}
          >
            <Input
              placeholder="Digite as palavras que deseja pesquisar"
              value={keywords}
              onChange={handleKeywordsChange}
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={selectedStartDate}
                onChange={handleStartDateChange}
              />
              <Input
                type="date"
                value={selectedEndDate}
                onChange={handleEndDateChange}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          <ScrollArea className="h-[600px] pr-4 w-full">
            {results.length > 0 &&
              results.map((result, resultIndex) => (
                <div key={resultIndex}>
                  {result.cards.map((card, index) => (
                    <div
                      key={index}
                      style={{
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        borderRadius: "8px",
                        overflow: "hidden",
                        marginBottom: "16px",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#00B2FF",
                          padding: "12px 16px",
                          color: "white",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        dangerouslySetInnerHTML={{ __html: card.header }}
                      ></div>
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "white",
                        }}
                        dangerouslySetInnerHTML={{ __html: card.body }}
                      ></div>
                      <div
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "white",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          style={{
                            backgroundColor: "#006fbb",
                            color: "white",
                            padding: "8px 16px",
                            textDecoration: "none",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Certificar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
