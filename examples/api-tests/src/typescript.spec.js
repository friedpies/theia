/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

// @ts-check
describe('TypeScript', function () {
    const { assert } = chai;

    const Uri = require('@theia/core/lib/common/uri');
    const { BrowserMainMenuFactory } = require('@theia/core/lib/browser/menu/browser-menu-plugin');
    const { EditorManager } = require('@theia/editor/lib/browser/editor-manager');
    const { EDITOR_CONTEXT_MENU } = require('@theia/editor/lib/browser/editor-menu');
    const { WorkspaceService } = require('@theia/workspace/lib/browser/workspace-service');
    const { MonacoEditor } = require('@theia/monaco/lib/browser/monaco-editor');
    const { EditorWidget } = require('@theia/editor/lib/browser/editor-widget');
    const { HostedPluginSupport } = require('@theia/plugin-ext/lib/hosted/browser/hosted-plugin');

    /** @type {import('inversify').Container} */
    const container = window['theia'].container;
    const editorManager = container.get(EditorManager);
    const workspaceService = container.get(WorkspaceService);
    const menuFactory = container.get(BrowserMainMenuFactory);
    const pluginService = container.get(HostedPluginSupport);

    const rootUri = new Uri.default(workspaceService.tryGetRoots()[0].uri);
    const fileUri = rootUri.resolve('src-gen/backend/server.js');

    /** @type {EditorWidget} */
    let widget;
    /** @type {MonacoEditor} */
    let editor;

    before(async function () {
        this.timeout(15000);
        Promise.all([
            await pluginService.load(),
            editorManager.closeAll({ save: false })
        ]);
        const plugin = pluginService.plugins.find(p => p.model.id === 'vscode.typescript-language-features');
        await pluginService.activatePlugin(plugin.model.id);
        widget = await editorManager.open(fileUri, { mode: 'activate' });
        editor = MonacoEditor.get(widget);
    });

    after(async () => {
        widget = undefined;
        editor = undefined;
        await editorManager.closeAll({ save: false });
    });

    it('document formating should be visible and enabled in the editor context menu', () => {
        const menu = menuFactory.createContextMenu(EDITOR_CONTEXT_MENU);
        const item = menu.items.find(i => i.command === 'editor.action.formatDocument');
        assert.isDefined(item);
        assert.isTrue(item.isVisible);
        assert.isTrue(item.isEnabled);
    });

});
