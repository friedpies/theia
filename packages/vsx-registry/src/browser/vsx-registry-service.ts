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

import { injectable, inject, postConstruct } from 'inversify';
import * as showdown from 'showdown';
import * as sanitize from 'sanitize-html';
import { Emitter } from '@theia/core/lib/common/event';
import { VSXRegistryAPI, VSXResponseError } from './vsx-registry-api';
import { VSXRegistrySearchParam, VSCodeExtensionPart, VSCodeExtensionFull } from './vsx-registry-types';
import { OpenerService, open } from '@theia/core/lib/browser';
import { VSXRegistryUri } from './view/detail/vsx-registry-open-handler';
import { PluginServer } from '@theia/plugin-ext';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';

// TODO: VSCodeExtensionManager
@injectable()
export class VSXRegistryService {

    protected readonly onDidUpdateSearchResultEmitter = new Emitter<void>();
    readonly onDidSearch = this.onDidUpdateSearchResultEmitter.event;

    protected readonly onDidUpdateInstalledEmitter = new Emitter<void>();
    readonly onDidChangeInstalled = this.onDidUpdateInstalledEmitter.event;

    @inject(VSXRegistryAPI) protected readonly api: VSXRegistryAPI;
    @inject(OpenerService) protected readonly openerService: OpenerService;
    @inject(HostedPluginSupport) protected readonly pluginSupport: HostedPluginSupport;
    @inject(PluginServer) protected readonly pluginServer: PluginServer;

    @postConstruct()
    protected init(): void {
        this.update();
        this.api.onDidChange(e => this.update());
        this.pluginSupport.onDidChangePlugins(() => this.updateInstalled());
    }

    protected update(): void {
        this.find(this.searchParam);
        this.updateInstalled();
    }

    protected _installed: VSCodeExtensionPart[] = [];
    get installed(): VSCodeExtensionPart[] {
        return this._installed;
    }

    isInstalled(extension: VSCodeExtensionPart): boolean {
        const id = extension.publisher.toLowerCase() + '.' + extension.name.toLowerCase();
        return !!this.pluginSupport.getPlugin(id);
    }

    protected _searchResult: VSCodeExtensionPart[] = [];
    get searchResult(): VSCodeExtensionPart[] {
        return this._searchResult;
    }

    protected searchParam: VSXRegistrySearchParam | undefined;
    // TODO: cancellation support
    async find(param?: VSXRegistrySearchParam): Promise<void> {
        this.searchParam = param;
        const result = await this.api.search(param && param.query);
        this._searchResult = result;
        this.onDidUpdateSearchResultEmitter.fire(undefined);
    }

    protected async updateInstalled(): Promise<void> {
        const plugins = this.pluginSupport.plugins;
        const installed: VSCodeExtensionPart[] = [];
        await Promise.all(plugins.map(async plugin => {
            if (plugin.model.engine.type === 'vscode') {
                try {
                    const ext = await this.api.getExtension(plugin.model.id);
                    installed.push(ext);
                } catch (e) {
                    if (VSXResponseError.is(e) && e.response.status === 404) {
                        return;
                    }
                    console.error('Failed to look up an extension:', e);
                }
            }
        }));
        this._installed = installed;
        this.onDidUpdateInstalledEmitter.fire();
    }

    async install(extension: VSCodeExtensionPart): Promise<void> {
        const id = extension.publisher.toLowerCase() + '.' + extension.name.toLowerCase();
        await this.pluginServer.deploy(VSXRegistryUri.toUri(id).toString());
    }

    async uninstall(extension: VSCodeExtensionPart): Promise<void> {
        const id = extension.publisher.toLowerCase() + '.' + extension.name.toLowerCase();
        await this.pluginServer.undeploy(id);
    }

    async getExtension(id: string): Promise<VSCodeExtensionFull> {
        return this.api.getExtension(id);
    }

    async open(extension: VSCodeExtensionPart): Promise<void> {
        const id = extension.publisher.toLowerCase() + '.' + extension.name.toLowerCase();
        await open(this.openerService, VSXRegistryUri.toUri(id), { mode: 'reveal' });
    }

    async compileDocumentation(extension: VSCodeExtensionFull): Promise<string> {
        if (extension.readmeUrl) {
            const markdownConverter = new showdown.Converter({
                noHeaderId: true,
                strikethrough: true,
                headerLevelStart: 2
            });
            const readme = await this.api.fetchText(extension.readmeUrl);
            const readmeHtml = markdownConverter.makeHtml(readme);
            return sanitize(readmeHtml, {
                allowedTags: sanitize.defaults.allowedTags.concat(['h1', 'h2', 'img'])
            });
        }
        return '';
    }
}
