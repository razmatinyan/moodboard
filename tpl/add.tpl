[addnews]
	<div id="addnews" class="addnews-menu-wrapper midside">
		<h1 class="addnews-title">Create Moodboard</h1>
		<div class="addnews-menu">
			<div class="item" onclick="getUserItems('moodboards')">
				<h3>My Moodboards</h3>
			</div>
			<div class="item" onclick="getUserItems('collections')">
				<h3>Collections</h3>
			</div>
		</div>
	</div>
	<div id="moodboard" class="hide">
		<div class="main-wrapper">
			<aside class="left-panel">
				<div class="panel">
					<div class="panel-item" data-panel-item="models" onclick="togglePanel('models');">
						<span class="item-title">Models</span>
					</div>
					<div class="panel-item" onclick="addText();">
						<span class="item-title">Text</span>
					</div>
					<div class="panel-item" data-panel-item="settings" onclick="togglePanel('settings');">
						<span class="item-title">Settings</span>
					</div>
				</div>

				<div id="panel-models" class="panel-content models" data-panel="models"></div>
				<div id="panel-settings" class="panel-content settings" data-panel="settings">
					<div class="row-setting">
						<span class="row-title">Background Color</span>
						<input type="color" id="bg-color" class="color-input bg-color" value="#ffffff">
						<span class="bg-reset" id="bg-reset">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"/></svg>
						</span>
					</div>
					<div class="row-setting">
						<span class="row-title">Background Image</span>
						<div id="bg-image" class="bg-image"></div>
						[xfinput_bg-image]
					</div>
				</div>
			</aside>
			<main class="moodboard-wrapper">
				<div class="mb-header">
					<div id="state-controls" class="state-controls header-section">
						<div id="undo" class="undo icon-btn disabled" data-tooltip="Undo (Ctrl + Z)">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-90deg-left" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4z"/></svg>
						</div>
						<div id="redo" class="redo icon-btn disabled" data-tooltip="Redo (Ctrl + Y)">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-90deg-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14.854 4.854a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 4H3.5A2.5 2.5 0 0 0 1 6.5v8a.5.5 0 0 0 1 0v-8A1.5 1.5 0 0 1 3.5 5h9.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4z"/></svg>
						</div>
					</div>
				</div>
				<div id="moodboard-content" class="mb-content"></div>
				<div class="mb-footer"></div>
			</main>
		</div>
	</div>
	<span class="tooltip"></span>
	<div id="image-menu" class="shape-menu image-menu">
		<div class="menu-item" data-menu-action="delete" data-tooltip="Delete" data-tooltip-position="top" data-tooltip-offset-y="12">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
		</div>
		<div class="menu-item" data-menu-action="lock" data-tooltip="Lock" data-tooltip-position="top" data-tooltip-offset-y="12">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 32"><g id="Layer_2" data-name="Layer 2"><g id="lock"><path d="M14,0A10.08,10.08,0,0,0,4,10.15V12H2a2,2,0,0,0-2,2V30a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V14a2,2,0,0,0-2-2H24V10.15A10.08,10.08,0,0,0,14,0ZM6,10.15A8.09,8.09,0,0,1,14,2a8.09,8.09,0,0,1,8,8.15V12H6ZM26,30H2V14H26Zm-8-8a4,4,0,1,0-4,4A4,4,0,0,0,18,22Zm-4,2a2,2,0,1,1,2-2A2,2,0,0,1,14,24Z"/></g></g></svg>
		</div>
	</div>
	<div id="text-menu" class="shape-menu text-menu">
		<div class="menu-item" data-menu-action="delete" data-menu-action="delete" data-tooltip="Delete" data-tooltip-position="top" data-tooltip-offset-y="12">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
		</div>
		<div class="menu-item" data-menu-action="lock" data-tooltip="Lock" data-tooltip-position="top" data-tooltip-offset-y="12">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 32"><g id="Layer_2" data-name="Layer 2"><g id="lock"><path d="M14,0A10.08,10.08,0,0,0,4,10.15V12H2a2,2,0,0,0-2,2V30a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V14a2,2,0,0,0-2-2H24V10.15A10.08,10.08,0,0,0,14,0ZM6,10.15A8.09,8.09,0,0,1,14,2a8.09,8.09,0,0,1,8,8.15V12H6ZM26,30H2V14H26Zm-8-8a4,4,0,1,0-4,4A4,4,0,0,0,18,22Zm-4,2a2,2,0,1,1,2-2A2,2,0,0,1,14,24Z"/></g></g></svg>
		</div>
	</div>
	<div id="general-menu" class="shape-menu general-menu">
		<div class="menu-item" data-menu-action="delete" data-menu-action="delete" data-tooltip="Delete" data-tooltip-position="top" data-tooltip-offset-y="12">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
		</div>
		<div class="menu-item" data-menu-action="lock" data-tooltip="Lock" data-tooltip-position="top" data-tooltip-offset-y="12">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 32"><g id="Layer_2" data-name="Layer 2"><g id="lock"><path d="M14,0A10.08,10.08,0,0,0,4,10.15V12H2a2,2,0,0,0-2,2V30a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V14a2,2,0,0,0-2-2H24V10.15A10.08,10.08,0,0,0,14,0ZM6,10.15A8.09,8.09,0,0,1,14,2a8.09,8.09,0,0,1,8,8.15V12H6ZM26,30H2V14H26Zm-8-8a4,4,0,1,0-4,4A4,4,0,0,0,18,22Zm-4,2a2,2,0,1,1,2-2A2,2,0,0,1,14,24Z"/></g></g></svg>
		</div>
	</div>
[/addnews]