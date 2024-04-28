"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WithContext as ReactTags } from "react-tag-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import DOMPurify from "dompurify";

const ITEMS_PER_PAGE = 10;

const KeyCodes = {
	comma: 188,
	enter: 13
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

export function Chat() {
	const [tags, setTags] = useState(() => {
		const savedTags = localStorage.getItem("tags");
		return savedTags ? JSON.parse(savedTags) : [];
	});

	const [selectedStartDate, setSelectedStartDate] = useState(() => {
		return (
			localStorage.getItem("selectedStartDate") ||
			new Date().toISOString().split("T")[0]
		);
	});

	const [selectedEndDate, setSelectedEndDate] = useState(() => {
		return (
			localStorage.getItem("selectedEndDate") ||
			new Date().toISOString().split("T")[0]
		);
	});

	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		localStorage.setItem("tags", JSON.stringify(tags));
		localStorage.setItem("selectedStartDate", selectedStartDate);
		localStorage.setItem("selectedEndDate", selectedEndDate);
	}, [tags, selectedStartDate, selectedEndDate]);

	const handleDelete = i => {
		setTags(tags.filter((tag, index) => index !== i));
	};

	const handleAddition = tag => {
		setTags([...tags, tag]);
	};

	const handleStartDateChange = event => {
		setSelectedStartDate(event.target.value);
	};

	const handleEndDateChange = event => {
		setSelectedEndDate(event.target.value);
	};

	// Calcula o número total de páginas
	const pageCount = Math.ceil(results.length / ITEMS_PER_PAGE);

	const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
	const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
	const currentResults = results.slice(indexOfFirstItem, indexOfLastItem);

	// Função para mudar de página
	const handlePageChange = pageNumber => {
		setCurrentPage(pageNumber);
	};

	const handleSubmit = async event => {
		event.preventDefault();
		setIsLoading(true);

		const keywords = tags.map(tag => tag.text);

		const formattedStartDate = selectedStartDate.split("-").join("");
		const formattedEndDate = selectedEndDate.split("-").join("");

		const allResultsPromises = keywords.map(async keyword => {
			const url = `https://www.imprensaoficial.com.br/DO/BuscaDO2001Resultado_11_3.aspx?filtropalavraschave=${encodeURIComponent(keyword)}&filtrodatainiciosalvar=${formattedStartDate}&filtrodatafimsalvar=${formattedEndDate}&filtrotodosgrupos=True`;
			const response = await fetch(url);
			const text = await response.text();

			return {
				keyword,
				text
			};
		});

		try {
			const allResults = await Promise.all(allResultsPromises);

			const parsedResults = allResults.map(result => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(result.text, "text/html");
				const cards = doc.querySelectorAll(".resultadoBuscaItem");

				const cleanedCards = Array.from(cards).map(card => {
					const linkElement = card.querySelector(".card-text a");
					let link = linkElement ? linkElement.getAttribute("href") : "";
					link = link.startsWith("http")
						? link
						: `https://www.imprensaoficial.com.br${link}`;

					return {
						header: DOMPurify.sanitize(
							card.querySelector(".card-header").innerHTML
						),
						body: DOMPurify.sanitize(
							card.querySelector(".card-body").innerHTML
						),
						link: link
					};
				});

				return {
					keyword: result.keyword,
					cards: cleanedCards
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
					<CardTitle>Busque no diario oficial</CardTitle>
					<CardDescription>
						Use os inputs abaixo para procurar por informações e selecionar o
						intervalo de datas.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-2 w-full mb-6"
					>
						<ReactTags
							tags={tags}
							suggestions={[]}
							handleDelete={handleDelete}
							handleAddition={handleAddition}
							delimiters={delimiters}
							inputFieldPosition="inline"
							placeholder="Digite as palavras..."
							classNames={{
								tags: "flex-wrap gap-2 overflow-auto p-2 border border-gray-300 rounded",
								tagInput: "w-full flex",
								tag: "justify-center items-center text-xs text-white bg-blue-500 rounded ml-2 mb-2 px-2 py-1 my-1",
								remove: "cursor-pointer text-white ml-2",
								tagInputField: "w-full flex-1 border-none p-1 m-1 text-sm"
							}}
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
						{currentResults.length > 0 &&
							currentResults.map((result, resultIndex) => (
								<div key={resultIndex}>
									{result.cards.map((card, index) => (
										<div
											key={index}
											style={{
												boxShadow: "0 2px 1px rgba(0, 0, 0, 0.1)",
												borderRadius: "8px",
												overflow: "hidden",
												marginBottom: "16px",
												fontFamily: "Arial, sans-serif"
											}}
										>
											<div
												style={{
													backgroundColor: "#00B2FF",
													padding: "12px 16px",
													color: "white",
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center"
												}}
												dangerouslySetInnerHTML={{ __html: card.header }}
											></div>
											<div
												style={{
													padding: "16px",
													backgroundColor: "white"
												}}
												dangerouslySetInnerHTML={{ __html: card.body }}
											></div>
											<div
												style={{
													padding: "12px 16px",
													backgroundColor: "white",
													display: "flex",
													justifyContent: "flex-end"
												}}
											>
												<button
													onClick={() => (window.location.href = card.link)}
													style={{
														backgroundColor: "#006fbb",
														color: "white",
														padding: "8px 16px",
														textDecoration: "none",
														border: "none",
														borderRadius: "4px",
														fontWeight: "bold",
														cursor: "pointer"
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
					<div className="flex justify-center items-center my-4">
						{[...Array(pageCount)].map((_, i) => (
							<button
								key={i + 1}
								onClick={() => handlePageChange(i + 1)}
								className={`mx-2 p-2 ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
							>
								{i + 1}
							</button>
						))}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
