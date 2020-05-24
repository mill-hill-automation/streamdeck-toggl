/* eslint-disable no-unused-vars, no-undef */
const togglBaseUrl = 'https://www.toggl.com/api/v8'

let websocket = null
let uuid = null

function connectElgatoStreamDeckSocket (inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo) {
  uuid = inPropertyInspectorUUID

  websocket = new WebSocket('ws://localhost:' + inPort)

  websocket.onopen = function () {
    // WebSocket is connected, register the Property Inspector
    websocket.send(JSON.stringify({
      event: inRegisterEvent,
      uuid: inPropertyInspectorUUID
    }))

    // Request settings
    websocket.send(JSON.stringify({
      event: 'getSettings',
      context: uuid
    }))
  }

  websocket.onmessage = function (evt) {
    // Received message from Stream Deck
    const jsonObj = JSON.parse(evt.data)

    if (jsonObj.event === 'didReceiveSettings') {
      const payload = jsonObj.payload.settings

      if (payload.apiToken) document.getElementById('apitoken').value = payload.apiToken
      if (payload.activity) document.getElementById('activity').value = payload.activity

      updateWorkspaces(document.getElementById('apitoken').value).then(e => {
        if (payload.workspaceId) document.getElementById('wid').value = payload.workspaceId

        updateProjects(document.getElementById('apitoken').value, payload.workspaceId).then(e => {
          if (payload.projectId) document.getElementById('pid').value = payload.projectId

          const el = document.querySelector('.sdpi-wrapper')
          el && el.classList.remove('hidden')
        })
      })
    }
  }
}

function sendSettings () {
  websocket && (websocket.readyState === 1) &&
  websocket.send(JSON.stringify({
    event: 'setSettings',
    context: uuid,
    payload: {
      apiToken: document.getElementById('apitoken').value,
      activity: document.getElementById('activity').value,
      workspaceId: document.getElementById('wid').value,
      projectId: document.getElementById('pid').value
    }
  }))
}

function setAPIToken () {
  document.getElementById('wid').innerHTML = ''
  document.getElementById('pid').innerHTML = ''
  updateWorkspaces(document.getElementById('apitoken').value)
  sendSettings()
}

function setWorkspace () {
  updateProjects(document.getElementById('apitoken').value, document.getElementById('wid').value)
  sendSettings()
}

async function updateProjects (apiToken, workspaceId) {
  await getProjects(apiToken, workspaceId).then(projectsData => {
    document.getElementById('pid').innerHTML = '<option value="0"></option>'
    const selectEl = document.getElementById('pid')

    for (projectNum in projectsData) {
      const optionEl = document.createElement('option')
      optionEl.innerText = projectsData[projectNum].name
      optionEl.value = projectsData[projectNum].id.toString()
      selectEl.append(optionEl)
    }
  })
}

async function updateWorkspaces (apiToken) {
  await getWorkspaces(apiToken).then(workspaceData => {
    document.getElementById('wid').innerHTML = ''
    const selectEl = document.getElementById('wid')

    for (ws in workspaceData) {
      const optionEl = document.createElement('option')
      optionEl.innerText = workspaceData[ws].name
      optionEl.value = workspaceData[ws].id.toString()
      selectEl.append(optionEl)
    }
  })
}

async function getProjects (apiToken, workspaceId) {
  const response = await fetch(
    `${togglBaseUrl}/workspaces/${workspaceId}/projects`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${apiToken}:api_token`)}`
      }
    })
  const data = await response.json()
  return data
}

async function getWorkspaces (apiToken) {
  const response = await fetch(
    `${togglBaseUrl}/workspaces`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${apiToken}:api_token`)}`
      }
    })
  const data = await response.json()
  return data
}

function openPage (site) {
  websocket && (websocket.readyState === 1) &&
  websocket.send(JSON.stringify({
    event: 'openUrl',
    payload: {
      url: 'https://' + site
    }
  }))
}
