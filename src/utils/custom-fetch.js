export default (endpoint, username, token) =>
	fetch(
		endpoint,
		username && token
			? {
					headers: {
						Authorization: 'Basic ' + btoa(username + ':' + token),
					},
			  }
			: undefined
	)
