//biome-ignore lint/complexity/noBannedTypes: no banned types
export type Env = {};

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		if (request.method !== "GET") {
			return new Response("Method Not Allowed", { status: 405 });
		}
		const url = new URL(request.url);
		if (url.pathname !== "/") {
			return new Response("Not Found", { status: 404 });
		}

		const qURL = url.searchParams.get("url");
		if (qURL === null) {
			return new Response("Missing URL parameter", { status: 400 });
		}
		console.log(qURL);
		const response = await fetch(qURL);
		if (!response.ok) {
			return new Response("Failed to fetch URL", { status: 500 });
		}
		const ogpExtractor = new OGPExtractor();
		await new HTMLRewriter()
			.on('meta[property^="og:"]', ogpExtractor)
			.transform(response)
			.text(); // required to trigger the transformation

		const options: RequestInitCfPropertiesImage = {
			// blur: 10,
			border: {
				color: "#43c5f5",
				width: 10,
			},
			background: "white",
		};
		if (ogpExtractor.image === "") {
			return new Response("No image found", { status: 404 });
		}

		return await fetch(ogpExtractor.image, {
			cf: {
				image: options,
			},
		});
	},
};

class OGPExtractor {
	title: string;
	description: string;
	image: string;

	constructor() {
		this.title = "";
		this.description = "";
		this.image = "";
	}

	element(element: Element) {
		const property = element.getAttribute("property");
		const content = element.getAttribute("content") || "";
		if (property === "og:title") {
			this.title = content;
		} else if (property === "og:description") {
			this.description = content;
		} else if (property === "og:image") {
			this.image = content;
		} else {
			console.log("ignore property: ", property, content);
		}
	}
}
