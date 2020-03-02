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
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/lib/common/event';
import { VSCodeExtensionPart, VSCodeExtensionFull } from './vsx-registry-types';
import { VSXRegistryPreferences } from './vsx-registry-preferences';

export interface VSXResponseError extends Error {
    code: 'VSX_RESPONSE_ERROR'
    response: Response
}
export namespace VSXResponseError {
    const code: 'VSX_RESPONSE_ERROR' = 'VSX_RESPONSE_ERROR';
    export function create(url: string, response: Response): VSXResponseError {
        return Object.assign(new Error(url + ' ' + response.status), { code, response });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function is(error: any): error is VSXResponseError {
        return !!error && typeof error === 'object'
            && 'code' in error && error['code'] === code
            && 'response' in error && error['response'] instanceof Response;
    }
}

@injectable()
export class VSXRegistryAPI {

    @inject(VSXRegistryPreferences)
    protected readonly preferences: VSXRegistryPreferences;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange = this.onDidChangeEmitter.event;

    @postConstruct()
    protected init(): void {
        this.preferences.onPreferenceChanged(e => {
            if (e.preferenceName === 'vsx-registry.url') {
                this.onDidChangeEmitter.fire(undefined);
            }
        });
    }

    protected get apiUri(): URI {
        return new URI(this.preferences['vsx-registry.url']).resolve('api');
    }

    async search(query?: string): Promise<VSCodeExtensionPart[]> {
        let searchUri = this.apiUri.resolve('-/search');
        if (query) {
            searchUri = searchUri.withQuery('query=' + query);
        }
        // TODO handle pagging
        const json = await this.fetchJson<{ extensions: VSCodeExtensionPart[] }>(searchUri.toString());
        return json.extensions;
    }

    async getExtension(id: string): Promise<VSCodeExtensionFull> {
        return this.fetchJson(this.apiUri.resolve(id.replace('.', '/')).toString());
    }

    async fetchText(url: string): Promise<string> {
        const response = await this.run(url);
        return response.text();
    }

    protected async fetchJson<T>(url: string): Promise<T> {
        const response = await this.run(url);
        return response.json();
    }

    protected async run(url: string): Promise<Response> {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw VSXResponseError.create(url, response);
        }
        return response;
    }

}
