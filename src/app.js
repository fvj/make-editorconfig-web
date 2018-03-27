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
import { GenerateForm, AuthorizationModal } from './components'
import {
	getRateLimit,
	getLatestCommit,
	getCommitTree,
	generateRawNodes,
} from './utils/github-api-wrappers'

const VERSION = '0.0.1'

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
		const { owner, name } = this.state.repository

		const limit = await getRateLimit(username, token)

		const commit = await getLatestCommit(owner, name, username, token)
		const commitTree = await getCommitTree(
			owner,
			name,
			commit.sha,
			username,
			token
		)

		// we need at least commitTree.length requests. TODO: handle cases where even the authorized rate limit is exhausted
		if (limit < commitTree.length) {
			this.setState({ askForAuthorization: true })
			return
		}

		this.setState({ files: commitTree }, this.readFilesAndGenerate)
	}

	async readFilesAndGenerate() {
		const nodes = await generateRawNodes(this.state.files)
		const tree = constructTree(nodes)
		tree.mergeAttributes(true)
		tree.clean()
		tree.mergeByExtensions()
		this.setState({
			config:
				`# make-editorconfig-web ${VERSION}\n# github.com/fvj/make-editorconfig-web\n\n` +
				generateConfig(tree),
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
