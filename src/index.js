import { render } from 'react-dom'
import React from 'react'
import {
	generateConfig,
	constructTree,
	printAttributes,
} from 'make-editorconfig'

// hack, pls fix
window.dynFetch = window.fetch.bind(window)

class App extends React.Component {
	constructor() {
		super()
		this.state = {
			token: '',
			user: '',
			repository: {
				user: 'fvj',
				name: 'make-editorconfig',
			},
			config: '',
		}
		this.handleChange = this.handleChange.bind(this)
		this.generateConfig = this.generateConfig.bind(this)
	}

	generateConfig() {
		const getLatestTree = () =>
			dynFetch(
				`https://api.github.com/repos/${this.state.repository.user}/${
					this.state.repository.name
				}/commits`
			)
				.then(blob => blob.json())
				.then(json => json.shift().commit.tree)

		const getFiles = tree =>
			dynFetch(tree.url + '?recursive=1')
				.then(blob => blob.json())
				.then(json => json.tree)

		const readFiles = nodes =>
			Promise.all(
				nodes.map(
					node =>
						node.type === 'blob'
							? dynFetch(node.url)
									.then(blob => blob.json())
									.then(
										json => (
											console.log(json),
											{ path: node.path, content: atob(json.content) }
										)
									)
							: Promise.resolve(node)
				)
			)

		getLatestTree()
			.then(getFiles)
			.then(readFiles)
			.then(nodes => {
				const tree = constructTree(nodes)
				tree.mergeAttributes(true)
				tree.clean()
				tree.mergeByExtensions()
				this.setState({
					config: generateConfig(tree),
				})
			})
	}

	componentDidUpdate() {
		if (this.state.user && this.state.token) {
			console.log('using authentication...')
			window.dynFetch = url => (
				console.log('auth fetching', url),
				fetch(url, {
					headers: {
						Authorization: `Basic ${btoa(
							this.state.user + ':' + this.state.token
						)}`,
					},
				})
			)
		} else {
			console.log('resetting fetch')
			window.dynFetch = window.fetch.bind(window)
		}
	}

	handleChange(e) {
		switch (e.target.id) {
			case 'repository-user': {
				const user = e.target.value
				const name = this.state.repository.name
				this.setState({ repository: { user, name } })
				break
			}
			case 'repository-name': {
				const name = e.target.value
				const user = this.state.repository.user
				this.setState({ repository: { name, user } })
				break
			}
			case 'token': {
				const token = e.target.value
				this.setState({ token })
				break
			}
			case 'user': {
				const user = e.target.value
				this.setState({ user })
				break
			}
		}
	}

	render() {
		const { repository } = this.state
		return (
			<div id="wrapper">
				<input
					type="text"
					id="repository-user"
					value={repository.user}
					onChange={this.handleChange}
				/>
				<input
					type="text"
					id="repository-name"
					value={repository.name}
					onChange={this.handleChange}
				/>
				<input
					type="text"
					id="user"
					value={this.state.user}
					onChange={this.handleChange}
				/>
				<input
					type="text"
					id="token"
					value={this.state.token}
					onChange={this.handleChange}
				/>
				<button id="generate" onClick={this.generateConfig}>
					Generate
				</button>
				<textarea id="config" value={this.state.config} />
			</div>
		)
	}
}

render(<App />, document.getElementById('app'))
