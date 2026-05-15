/**
 * TFS API — Common Functions
 * ===========================
 * Drop this <script src="../common/tfs-api.js"></script> into any tool's HTML.
 *
 * Uses XMLHttpRequest for NTLM/Negotiate auth (works on corporate networks).
 * Falls back to fetch + Basic auth when a CORS proxy is configured.
 *
 * Usage:
 *   TFS.configure({ baseUrl: 'https://tfs.casepoint.in/tfs/Casepoint', pat: 'xxx' });
 *   TFS.get('/CasepointARA/_apis/wit/classificationnodes/iterations?$depth=3&api-version=2.0')
 *      .then(data => console.log(data));
 *   TFS.post('/CasepointARA/_apis/wit/wiql?api-version=2.0', { query: '...' })
 *      .then(data => console.log(data));
 */
var TFS = (function () {
    var config = {
        baseUrl: 'https://tfs.casepoint.in/tfs/Casepoint',
        project: 'CasepointARA',
        pat: '',
        proxyUrl: '',
        apiVersion: '2.0'
    };

    var LS_PAT = 'tfs_common_pat';
    var LS_PROXY = 'tfs_common_proxy';

    /* Auto-detect local proxy: if served from localhost, use /tfs-proxy */
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        config.proxyUrl = window.location.origin + '/tfs-proxy?url=';
    }

    /* ─── CONFIGURE ─── */
    function configure(opts) {
        if (opts.baseUrl) config.baseUrl = opts.baseUrl.replace(/\/+$/, '');
        if (opts.project) config.project = opts.project;
        if (opts.pat) config.pat = opts.pat;
        if (opts.proxyUrl !== undefined) config.proxyUrl = opts.proxyUrl.replace(/\/+$/, '');
        if (opts.apiVersion) config.apiVersion = opts.apiVersion;
    }

    /* ─── RESTORE SAVED SETTINGS ─── */
    function loadSaved() {
        var pat = localStorage.getItem(LS_PAT) || localStorage.getItem('tfs_dashboard_pat') || '';
        var proxy = localStorage.getItem(LS_PROXY) || localStorage.getItem('tfs_dashboard_proxy') || '';
        if (pat) config.pat = pat;
        if (proxy) config.proxyUrl = proxy;
        return { pat: pat, proxy: proxy };
    }

    /* ─── SAVE SETTINGS ─── */
    function savePat(pat) {
        config.pat = pat;
        localStorage.setItem(LS_PAT, pat);
    }

    function saveProxy(proxy) {
        config.proxyUrl = proxy;
        if (proxy) localStorage.setItem(LS_PROXY, proxy);
        else localStorage.removeItem(LS_PROXY);
    }

    /* ─── BUILD URL ─── */
    function buildUrl(path) {
        var url = path.startsWith('http') ? path : config.baseUrl + path;
        if (url.indexOf('api-version') === -1) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + 'api-version=' + config.apiVersion;
        }
        return url;
    }

    function applyProxy(url) {
        return config.proxyUrl ? config.proxyUrl + encodeURIComponent(url) : url;
    }

    /* ─── CORE REQUEST (XMLHttpRequest for NTLM) ─── */
    function request(method, path, body) {
        var url = buildUrl(path);

        return new Promise(function (resolve, reject) {
            // If proxy is configured, use fetch + Basic auth (proxy handles CORS)
            if (config.proxyUrl) {
                var fetchUrl = applyProxy(url);
                var headers = { 'Authorization': 'Basic ' + btoa(':' + config.pat) };
                var fetchOpts = { method: method, headers: headers };
                if (body) {
                    headers['Content-Type'] = 'application/json';
                    fetchOpts.body = JSON.stringify(body);
                }
                fetchOpts.headers = headers;

                fetch(fetchUrl, fetchOpts).then(function (r) {
                    if (!r.ok) {
                        return r.text().then(function (t) {
                            reject(new Error('HTTP ' + r.status + ': ' + t.substring(0, 200)));
                        });
                    }
                    return r.json().then(resolve);
                }).catch(reject);
                return;
            }

            // No proxy — use XMLHttpRequest with NTLM/Negotiate
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.withCredentials = true;

            // Set Basic auth header — on NTLM servers, the browser will
            // negotiate automatically after the initial 401 challenge
            if (config.pat) {
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(':' + config.pat));
            }

            if (body) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new Error('HTTP ' + xhr.status + ': ' + xhr.responseText.substring(0, 200)));
                }
            };

            xhr.onerror = function () {
                reject(new Error('Network error — check if TFS is reachable. Try opening ' + config.baseUrl + ' in a new tab first to establish the connection.'));
            };

            xhr.send(body ? JSON.stringify(body) : null);
        });
    }

    /* ─── CONVENIENCE METHODS ─── */
    function get(path) { return request('GET', path); }

    function post(path, body) { return request('POST', path, body); }

    function patch(path, body) {
        var url = buildUrl(path);
        return new Promise(function (resolve, reject) {
            if (config.proxyUrl) {
                var fetchUrl = applyProxy(url);
                fetch(fetchUrl, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Basic ' + btoa(':' + config.pat),
                        'Content-Type': 'application/json-patch+json'
                    },
                    body: JSON.stringify(body)
                }).then(function (r) {
                    if (!r.ok) return r.text().then(function (t) { reject(new Error('HTTP ' + r.status + ': ' + t.substring(0, 200))); });
                    return r.json().then(resolve);
                }).catch(reject);
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.open('PATCH', url, true);
            xhr.withCredentials = true;
            if (config.pat) xhr.setRequestHeader('Authorization', 'Basic ' + btoa(':' + config.pat));
            xhr.setRequestHeader('Content-Type', 'application/json-patch+json');
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve(xhr.responseText); }
                } else {
                    reject(new Error('HTTP ' + xhr.status + ': ' + xhr.responseText.substring(0, 200)));
                }
            };
            xhr.onerror = function () { reject(new Error('Network error on PATCH')); };
            xhr.send(JSON.stringify(body));
        });
    }

    /* ─── HIGH-LEVEL HELPERS ─── */

    /** Validate connection by fetching connectionData */
    function testConnection() {
        return get('/_apis/connectionData').then(function (data) {
            var user = data.authenticatedUser || {};
            var props = user.properties || {};
            return {
                displayName: user.providerDisplayName || 'Unknown',
                account: (props.Account && props.Account.$value) || '',
                id: user.id || ''
            };
        });
    }

    /** Load areas for the project */
    function loadAreas(depth) {
        depth = depth || 1;
        return get('/' + config.project + '/_apis/wit/classificationnodes/areas?$depth=' + depth);
    }

    /** Load iterations for the project */
    function loadIterations(depth) {
        depth = depth || 3;
        return get('/' + config.project + '/_apis/wit/classificationnodes/iterations?$depth=' + depth);
    }

    /** Run a WIQL query and return work item IDs */
    function wiql(query) {
        return post('/' + config.project + '/_apis/wit/wiql', { query: query }).then(function (data) {
            return (data.workItems || []).map(function (wi) { return wi.id; });
        });
    }

    /** Batch fetch work items by IDs (200 per batch) */
    function getWorkItems(ids, fields) {
        if (!ids || ids.length === 0) return Promise.resolve([]);

        var fieldStr = (fields || [
            'System.Id', 'System.WorkItemType', 'System.Title', 'System.State',
            'System.AssignedTo', 'System.IterationPath', 'System.AreaPath',
            'System.Parent', 'System.ChangedDate',
            'Microsoft.VSTS.Common.Priority',
            'Microsoft.VSTS.Scheduling.RemainingWork',
            'Microsoft.VSTS.Scheduling.OriginalEstimate',
            'Microsoft.VSTS.Scheduling.CompletedWork',
            'Microsoft.VSTS.Common.Discipline',
            'System.Tags'
        ]).join(',');

        var batches = [];
        for (var i = 0; i < ids.length; i += 200) {
            batches.push(ids.slice(i, i + 200));
        }

        return batches.reduce(function (chain, batch) {
            return chain.then(function (all) {
                return get('/' + config.project + '/_apis/wit/workitems?ids=' + batch.join(',') + '&fields=' + fieldStr)
                    .then(function (data) {
                        return all.concat(data.value || []);
                    })
                    .catch(function (err) {
                        // Field fallback — retry without custom fields if 400
                        if (err.message && err.message.indexOf('400') !== -1) {
                            var basicFields = 'System.Id,System.WorkItemType,System.Title,System.State,System.AssignedTo,System.IterationPath,System.AreaPath,System.Parent,Microsoft.VSTS.Common.Priority,Microsoft.VSTS.Scheduling.RemainingWork,Microsoft.VSTS.Scheduling.OriginalEstimate,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Common.Discipline,System.Tags';
                            return get('/' + config.project + '/_apis/wit/workitems?ids=' + batch.join(',') + '&fields=' + basicFields)
                                .then(function (data) { return all.concat(data.value || []); });
                        }
                        throw err;
                    });
            });
        }, Promise.resolve([]));
    }

    /** Extract sprints (PI-XXXX pattern) from iteration tree */
    function getSprints(depth) {
        return loadIterations(depth || 4).then(function (data) {
            var found = [];
            function walk(node) {
                var name = node.name || '';
                var path = (node.path || '').replace(/^\\CasepointARA\\Iteration\\/, '');
                if (/PI-\d{4}/i.test(name) && node.attributes && node.attributes.startDate) {
                    found.push({
                        id: node.id,
                        name: name,
                        path: path,
                        start: new Date(node.attributes.startDate),
                        finish: node.attributes.finishDate ? new Date(node.attributes.finishDate) : null
                    });
                }
                (node.children || []).forEach(walk);
            }
            walk(data);
            found.sort(function (a, b) { return (b.start || 0) - (a.start || 0); });
            return found;
        });
    }

    /** Get areas as flat list */
    function getAreas() {
        return loadAreas(2).then(function (data) {
            var areas = [];
            function walk(node, depth) {
                if (depth > 0) {
                    areas.push({
                        id: node.id,
                        name: node.name,
                        path: (node.path || '').replace(/^\\CasepointARA\\Area\\/, '').replace(/^\\CasepointARA\\/, '')
                    });
                }
                (node.children || []).forEach(function (c) { walk(c, depth + 1); });
            }
            walk(data, 0);
            return areas;
        });
    }

    /** Map a raw TFS work item to a flat object */
    function mapItem(raw) {
        var f = raw.fields || {};
        var assignee = f['System.AssignedTo'] || '';
        if (typeof assignee === 'object') assignee = assignee.displayName || '';
        // Strip domain: "Name <DOMAIN\user>" → "Name"
        assignee = assignee.replace(/\s*<[^>]*>/, '').trim();

        return {
            id: f['System.Id'] || raw.id,
            type: f['System.WorkItemType'] || '',
            title: f['System.Title'] || '',
            state: f['System.State'] || '',
            assignee: assignee,
            priority: f['Microsoft.VSTS.Common.Priority'] != null ? +f['Microsoft.VSTS.Common.Priority'] : null,
            orig: f['Microsoft.VSTS.Scheduling.OriginalEstimate'] != null ? +f['Microsoft.VSTS.Scheduling.OriginalEstimate'] : null,
            remaining: f['Microsoft.VSTS.Scheduling.RemainingWork'] != null ? +f['Microsoft.VSTS.Scheduling.RemainingWork'] : null,
            completed: f['Microsoft.VSTS.Scheduling.CompletedWork'] != null ? +f['Microsoft.VSTS.Scheduling.CompletedWork'] : null,
            area: (f['System.AreaPath'] || '').replace(/^CasepointARA\\/, ''),
            iteration: f['System.IterationPath'] || '',
            parentId: f['System.Parent'] || null,
            discipline: f['Microsoft.VSTS.Common.Discipline'] || '',
            tags: f['System.Tags'] || '',
            execType: f['Casepoint.TFS.CustomFields.TaskExecutionType'] || ''
        };
    }

    /** Get sprint items as mapped objects */
    function getSprintItems(sprintPath, extraFields) {
        var q = "SELECT [System.Id] FROM WorkItems WHERE [System.IterationPath] UNDER '" +
            config.project + '\\' + sprintPath +
            "' AND [System.WorkItemType] IN ('Task','Requirement','Bug','Feature','User Story') AND [System.State] <> 'Removed' ORDER BY [System.WorkItemType] ASC, [System.Id] ASC";

        return wiql(q).then(function (ids) {
            return getWorkItems(ids, extraFields);
        }).then(function (rawItems) {
            return rawItems.map(mapItem);
        });
    }

    /* ─── PUBLIC API ─── */
    return {
        configure: configure,
        loadSaved: loadSaved,
        savePat: savePat,
        saveProxy: saveProxy,
        get: get,
        post: post,
        patch: patch,
        request: request,
        testConnection: testConnection,
        loadAreas: loadAreas,
        loadIterations: loadIterations,
        wiql: wiql,
        getWorkItems: getWorkItems,
        getSprints: getSprints,
        getAreas: getAreas,
        mapItem: mapItem,
        getSprintItems: getSprintItems,
        config: config
    };
})();
