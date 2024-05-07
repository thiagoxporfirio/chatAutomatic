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
import axios from "axios";

const predefinedTags = ["riuma"].map(tag => ({ id: tag, text: tag }));

export function Chat() {
	const [selectedStartDate, setSelectedStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedEndDate, setSelectedEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [tags, setTags] = useState(predefinedTags);
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
        const loadInitialData = () => {

			const savedTags = JSON.parse(localStorage.getItem("tags")) || [];
            const uniqueSavedTags = [...new Set([...predefinedTags.map(tag => tag.text), ...savedTags.map(tag => tag.text)])];
            setTags(uniqueSavedTags.map(tag => ({ id: tag, text: tag })));

            const savedStartDate = localStorage.getItem("selectedStartDate");
            const savedEndDate = localStorage.getItem("selectedEndDate");

           if (savedStartDate) setSelectedStartDate(savedStartDate);
            if (savedEndDate) setSelectedEndDate(savedEndDate);

            if (savedTags.length > 0 && savedStartDate && savedEndDate) {
                handleSubmit();
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        // Save to local storage only on updates after initial load
        localStorage.setItem("tags", JSON.stringify(tags));
        localStorage.setItem("selectedStartDate", selectedStartDate);
        localStorage.setItem("selectedEndDate", selectedEndDate);

    }, [tags, selectedStartDate, selectedEndDate]);

    useEffect(() => {

        if (typeof window !== "undefined" && tags.length > 0 && selectedStartDate && selectedEndDate) {
            handleSubmit();
        }

    }, [tags, selectedStartDate, selectedEndDate, currentPage]);

	useEffect(() => {

		if (currentPage > 1) {
			handleSubmit();
		} else if (currentPage <= 1) {
			handleSubmit();
		}

	}, [currentPage]);

	const handleDelete = i => {
        const tagText = tags[i].text;
        if (!predefinedTags.map(tag => tag.text).includes(tagText)) {
            setTags(tags.filter((tag, index) => index !== i));
        }
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

	const handlePageChange = pageNumber => {
		console.log("Mudando para a página: ", pageNumber);
		setCurrentPage(pageNumber);
	};

	// Para responder ao envio do formulário:
	const handleFormSubmit = event => {
		event.preventDefault();
		handleSubmit();
	};

	const buildCompleteUrl = (startDate, endDate, keyword, currentPage) => {
		// Formata as datas para o formato AAAAMMDD
		const formattedStartDate = startDate.split("-").join("");
		const formattedEndDate = endDate.split("-").join("");

		const formatDateToBR = date => {
			const parts = date.split("-");
			return `${parts[2]}/${parts[1]}/${parts[0]}`;
		};

		const formatDateToBRPonto = date => {
			const parts = date.split("-");
			return `${parts[2]}.${parts[1]}.${parts[0]}`;
		};

		const formattedStartDateBR = formatDateToBR(selectedStartDate);
		const formattedEndDateBR = formatDateToBR(selectedEndDate);

		const formattedStartDateBRPonto = formatDateToBRPonto(selectedStartDate);
		const formattedEndDateBRPonto = formatDateToBRPonto(selectedEndDate);

		const baseUrl = `https://www.imprensaoficial.com.br/DO/BuscaDO2001Resultado_11_3.aspx?filtropalavraschave=${keyword}&f=xhitlist&xhitlist_vpc=${currentPage}&xhitlist_x=Advanced&xhitlist_q=%5bfield+%27dc%3adatapubl%27%3a%3E%3d${formattedStartDateBRPonto}%3C%3d${formattedEndDateBRPonto}%5d(${keyword})&filtrogrupos=Todos%2c+Cidade+de+SP%2c+Editais+e+Leil%C3%B5es%2c+Empresarial%2c+Executivo%2c+Junta+Comercial%2c+DOU-Justi%C3%A7a%2c+Judici%C3%A1rio%2c+DJE%2c+Legislativo%2c+Municipios%2c+OAB%2c+Suplemento%2c+TRT+&xhitlist_mh=9999&filtrodatafimsalvar=${formattedEndDate}&filtroperiodo=${formattedStartDateBR}+a+${formattedEndDateBR}&filtrodatainiciosalvar=${formattedStartDate}&filtrogrupossalvar=Todos%2c+Cidade+de+SP%2c+Editais+e+Leil%C3%B5es%2c+Empresarial%2c+Executivo%2c+Junta+Comercial%2c+DOU-Justi%C3%A7a%2c+Judici%C3%A1rio%2c+DJE%2c+Legislativo%2c+Municipios%2c+OAB%2c+Suplemento%2c+TRT+&xhitlist_hc=%5bXML%5d%5bKwic%2c3%5d&xhitlist_vps=15&filtrotodosgrupos=True&xhitlist_d=Todos%2c+Cidade+de+SP%2c+Editais+e+Leil%C3%B5es%2c+Empresarial%2c+Executivo%2c+Junta+Comercial%2c+DOU-Justi%C3%A7a%2c+Judici%C3%A1rio%2c+DJE%2c+Legislativo%2c+Municipios%2c+OAB%2c+Suplemento%2c+TRT+&filtrotipopalavraschavesalvar=UP&xhitlist_s=&xhitlist_sel=title%3bField%3adc%3atamanho%3bField%3adc%3adatapubl%3bField%3adc%3acaderno%3bitem-bookmark%3bhit-context&xhitlist_xsl=xhitlist.xsl&navigators=`;

		// Retorna a URL completa
		return `${baseUrl}`;
	};

	const handleSubmit = async () => {
		if (!tags.length || !selectedStartDate || !selectedEndDate) return;

		setIsLoading(true);
		setResults([]);
		
		let allResultsCombined = [];

		for (const tag of tags) {
			const url = buildCompleteUrl(
				selectedStartDate,
				selectedEndDate,
				tag.text,
				currentPage
			);

			if (currentPage > 1) {
				const response = await axios.get("https://backend-automatic.vercel.app/fetch-data", {
					params: {
						url: url
					}
				});

				const text = await response.data;
				const parser = new DOMParser();
				const doc = parser.parseFromString(text, "text/html");
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

				allResultsCombined.push({
					keyword: tag.text,
					cards: cleanedCards
				});
			} else {
				const response = await fetch(url);
				const text = await response.text();

				const parser = new DOMParser();
				const doc = parser.parseFromString(text, "text/html");
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

				allResultsCombined.push({
					keyword: tag.text,
					cards: cleanedCards
				});
			}
		}

		setResults(allResultsCombined);
		setIsLoading(false);
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
						onSubmit={handleFormSubmit}
						className="flex flex-col gap-2 w-full mb-6"
					>
						<ReactTags
							tags={tags}
							suggestions={[]}
							handleDelete={handleDelete}
							handleAddition={handleAddition}
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
						{results.length > 0 &&
							results.map((result, resultIndex) => (
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
					{results.length === 0 ? (
						<p className="text-center text-gray-500 mt-4">
							Nenhum resultado encontrado.
						</p>
					) : (
						<>
							{/* Conteúdo e cards dos resultados, se necessário */}
							<div className="flex justify-center items-center my-4">
								{[...Array(10)].map((_, i) => (
									<button
										key={i + 1}
										onClick={() => handlePageChange(i + 1)}
										className={`mx-2 p-2 ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
									>
										{i + 1}
									</button>
								))}
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</>
	);
}
