import React from 'react'
import { Modal, Form, Button } from 'semantic-ui-react'

export default class AuthorizationModal extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			username: props.username,
			token: props.token,
		}
		this.handleInputChange = this.handleInputChange.bind(this)
	}

	handleInputChange(e) {
		console.log(e, this.state, this.props)
		const { id, value } = e.target
		switch (id) {
			case 'username': {
				this.setState({ username: value })
				break
			}

			case 'token': {
				this.setState({ token: value })
				break
			}
		}
	}

	render() {
		const { open, force, proceed, abort } = this.props
		const { username, token } = this.state
		return (
			<Modal open={open} size="small">
				<Modal.Header>Authorization</Modal.Header>
				<Modal.Content>
					<Modal.Description>
						{force && (
							<p>
								Github limits the amount of requests you can send to their API
								server. Unfortunately, there's more files in the repository you
								queried for than there are requests left.
							</p>
						)}
						<p>Please enter your username and a valid Github token.</p>
					</Modal.Description>
					<Form>
						<Form.Group widths="equal">
							<Form.Input
								id="username"
								label="Username"
								type="text"
								value={username}
								onChange={this.handleInputChange}
							/>
							<Form.Input
								id="token"
								label="Token"
								type="text"
								value={token}
								onChange={this.handleInputChange}
							/>
						</Form.Group>
					</Form>
				</Modal.Content>
				<Modal.Actions>
					<Button
						secondary
						icon="cancel"
						content="Cancel"
						onClick={() => {
							this.setState({
								username: this.props.username,
								token: this.props.token,
							})
							abort()
						}}
					/>
					<Button
						primary
						icon="check"
						content="Proceed"
						onClick={() => proceed(this.state.username, this.state.token)}
					/>
				</Modal.Actions>
			</Modal>
		)
	}
}
