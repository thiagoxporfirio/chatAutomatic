"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

export function Chat() {
	const [keywords, setKeywords] = useState("");
	const [selectedDate, setSelectedDate] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState([]);

	const handleKeywordsChange = event => {
		setKeywords(event.target.value);
	};

	const handleDateChange = event => {
		setSelectedDate(event.target.value);
	};

	const handleSubmit = async event => {
		event.preventDefault();
		setIsLoading(true);

		const keywordsArray = keywords.split(" ");

		const allResultsPromises = keywordsArray.map(async keyword => {
			const formattedDate = selectedDate.split("-").join("");
			const formattedStartDate = `${formattedDate}000000`;
			const formattedEndDate = `${formattedDate}235959`;
			
			const url = `https://www.imprensaoficial.com.br/DO/BuscaDO2001Resultado_11_3.aspx?filtropalavraschave=${encodeURIComponent(keyword)}&filtrodatainiciosalvar=${formattedStartDate}&filtrodatafimsalvar=${formattedEndDate}&filtrotodosgrupos=True`;
			const response = await fetch(url);
			const text = await response.text();

			// Aqui você precisará fazer o parsing do texto da resposta, talvez com DOMParser se for HTML
			// Ou de alguma outra forma se os resultados não forem HTML

			return {
				keyword,
				text
			};
		});

		try {
			const allResults = await Promise.all(allResultsPromises);
			setResults(allResults);
		} catch (error) {
			console.error("Error fetching results:", error);
		} finally {
			setIsLoading(false);
			console.log("Finished fetching results: ", results);
		}
	};

	useEffect(() => {

	}, [results]);

	return (
		<>
			<Card className="w-[640px]">
				<CardHeader>
					<CardTitle>Smart chat</CardTitle>
					<CardDescription>
						Use o input abaixo para procurar por informações e selecione a Data.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ScrollArea className="h-[600px] pr-4 w-full">
						<form
							className="flex flex-col gap-2 w-full"
							onSubmit={handleSubmit}
						>
							<Input
								placeholder="Digite as palavras que deseja pesquisar"
								value={keywords}
								onChange={handleKeywordsChange}
							/>
							<Input
								type="date"
								value={selectedDate}
								onChange={handleDateChange}
							/>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Buscando..." : "Buscar"}
							</Button>
						</form>
					</ScrollArea>
					<ScrollArea className="h-[600px] pr-4 w-full">
						{results.length > 0 && <div>{"teste"}</div>}
					</ScrollArea>
				</CardContent>
			</Card>
		</>
	);
}
