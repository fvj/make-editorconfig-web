import React from 'react'
import {
	generateConfig,
	constructTree,
	printAttributes,
} from 'make-editorconfig'
import {
	Container,
	Button,
	TextArea,
	Form,
	Modal,
	Icon,
	Header,
} from 'semantic-ui-react'
import GenerateForm from './components/GenerateForm'
import AuthorizationModal from './components/AuthorizationModal'
import customFetch from './utils/custom-github'

const VERSION = '0.0.1'
const GITHUB_API_BASE = 'https://api.github.com/'

const fetchGithub = (endpoint, ...args) =>
	customFetch(GITHUB_API_BASE + endpoint, ...args)

require('babel-polyfill')

class App extends React.Component {
	constructor() {
		super()
		this.state = {
			auth: {
				username: '',
				token: '',
			},
			repository: {
				owner: 'fvj',
				name: 'make-editorconfig',
			},
			config: '',
			askForAuthorization: false,
			working: false,
			showConfig: false,
			status: 'Idle.',
		}
		this.handleInputChange = this.handleInputChange.bind(this)
		this.closeModal = this.closeModal.bind(this)
		this.readFileList = this.readFileList.bind(this)
		this.readFilesAndGenerate = this.readFilesAndGenerate.bind(this)
	}

	async readFileList() {
		const { username, token } = this.state.auth

		const getRateLimit = () =>
			fetchGithub('rate_limit', username, token)
				.then(res => res.json())
				.then(({ rate: { remaining } }) => remaining)

		const getLatestCommit = (owner, repository) =>
			fetchGithub(`repos/${owner}/${repository}/commits`, username, token)
				.then(res => res.json())
				.then(commits => commits.shift())

		const getCommitTree = (owner, repository, sha) =>
			fetchGithub(
				`repos/${owner}/${repository}/git/trees/${sha}?recursive=1`,
				username,
				token
			)
				.then(res => res.json())
				.then(json =>
					json.tree.map(({ path, type, url }) => ({ path, type, url }))
				)

		const limit = await getRateLimit()

		// we need at least 2 requests to determine how many files there are to fetch
		// if (limit < 2) {
		// 	this.setState({ askForAuthorization: true })
		// 	return
		// }

		const { owner, name } = this.state.repository

		const commit = await getLatestCommit(owner, name)
		const commitTree = await getCommitTree(owner, name, commit.sha)

		// we need at least commitTree.length requests. TODO: handle cases where even the authorized rate limit is exhausted
		if (limit < commitTree.length) {
			this.setState({ askForAuthorization: true })
			return
		}

		this.setState({ files: commitTree }, this.readFilesAndGenerate)
	}

	async readFilesAndGenerate() {
		const generateRawNodes = tree => {
			const getFile = url =>
				customFetch(url, this.state.auth.username, this.state.auth.token).then(
					res => res.json()
				)

			return Promise.all(
				tree.map(node => {
					if (node.type === 'tree') return Promise.resolve(node)

					return getFile(node.url).then(({ content, encoding }) => {
						this.setState({ status: `Fetched ${node.path}` })
						if (encoding !== 'base64')
							throw new Error(
								`File ${node.path} has encoding ${encoding}. Aborting.`
							)

						return { path: node.path, content: atob(content) }
					})
				})
			)
		}

		const nodes = await generateRawNodes(this.state.files)
		const tree = constructTree(nodes)
		tree.mergeAttributes(true)
		tree.clean()
		tree.mergeByExtensions()
		this.setState({
			config: generateConfig(tree),
		})
	}

	handleInputChange(e) {
		switch (e.target.id) {
			case 'repository-owner': {
				const owner = e.target.value
				const name = this.state.repository.name
				this.setState({ repository: { owner, name } })
				break
			}
			case 'repository-name': {
				const name = e.target.value
				const owner = this.state.repository.owner
				this.setState({ repository: { name, owner } })
				break
			}
		}
	}

	updateAuthorization(username, token, callback = null) {
		this.setState({ auth: { username, token } }, callback)
	}

	closeModal() {
		this.setState({ askForAuthorization: false, showConfig: false })
	}

	render() {
		const { repository } = this.state
		return (
			<Container>
				<Header>make-editorconfig-web</Header>
				<AuthorizationModal
					open={this.state.askForAuthorization || this.state.showConfig}
					force={this.state.askForAuthorization}
					handleInputChange={this.handleInputChange}
					user={this.state.auth.username}
					token={this.state.auth.token}
					proceed={(username, token) => {
						if (username && token) {
							const continueFetching = this.state.askForAuthorization
							this.closeModal()
							this.updateAuthorization(
								username,
								token,
								continueFetching ? this.readFilesAndGenerate : undefined
							)
						}
					}}
					abort={this.closeModal}
				/>
				<GenerateForm
					repositoryUser={repository.owner}
					repositoryName={repository.name}
					config={this.state.config}
					generateConfig={this.readFileList}
					handleInputChange={this.handleInputChange}
					loading={this.state.working}
					showConfigModal={() => this.setState({ showConfig: true })}
				/>
				<p>Status: {this.state.status}</p>
			</Container>
		)
	}
}

export default App
