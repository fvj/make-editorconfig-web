import customFetch from './custom-fetch'

export const GITHUB_API_BASE = 'https://api.github.com/'

export const fetchGithub = (endpoint, ...args) =>
	customFetch(GITHUB_API_BASE + endpoint, ...args)

export const getRateLimit = (username, token) =>
	fetchGithub('rate_limit', username, token)
		.then(res => res.json())
		.then(({ rate: { remaining } }) => remaining)

export const getLatestCommit = (owner, repository, username, token) =>
	fetchGithub(`repos/${owner}/${repository}/commits`, username, token)
		.then(res => res.json())
		.then(commits => commits.shift())

export const getCommitTree = (owner, repository, sha, username, token) =>
	fetchGithub(
		`repos/${owner}/${repository}/git/trees/${sha}?recursive=1`,
		username,
		token
	)
		.then(res => res.json())
		.then(json => json.tree.map(({ path, type, url }) => ({ path, type, url })))

export const generateRawNodes = (tree, username, token) => {
	const getFile = url =>
		customFetch(url, username, token).then(res => res.json())

	return Promise.all(
		tree.map(node => {
			if (node.type === 'tree') return Promise.resolve(node) // leave tree nodes untouched, simply resolve

			return getFile(node.url).then(({ content, encoding }) => {
				if (encoding !== 'base64')
					throw new Error(
						`File ${node.path} has encoding ${encoding}. Aborting.`
					)

				return { path: node.path, content: atob(content) }
			})
		})
	)
}
