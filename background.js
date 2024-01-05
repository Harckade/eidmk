var attachedTabs = new Set();

function executeExtension() {
    chrome.windows.getAll({ populate: true }, function (windows) {
        for (var i = 0; i < windows.length; i++) {
            var tabs = windows[i].tabs;
            for (var j = 0; j < tabs.length; j++) {
                var tab = tabs[j];
                if (tab.url.startsWith('chrome://')) {
                    continue;
                }
                intercept(tab);
            }
        }
    });
}

function intercept(tab) {
    chrome.debugger.attach({ tabId: tab.id }, "1.0", function () {
        attachedTabs.add(tab.id);
        chrome.debugger.sendCommand({ tabId: tab.id }, "Network.enable", {}, function () {
            chrome.debugger.sendCommand({ tabId: tab.id }, "Network.setRequestInterception", { patterns: [{ urlPattern: "*://graph.microsoft.com/*" }, { urlPattern: "*://main.iam.ad.ext.azure.com/*" }] }, function () {
                console.log("Interception enabled");
                chrome.debugger.onEvent.addListener(function (debuggeeId, message, params) {
                    if (debuggeeId.tabId === tab.id && message === "Network.requestIntercepted") {
                        let request = params.request;
                        let modified = false;
                        let responseBody = '';
                        let interceptionId = params.interceptionId;
                        const statusCode = 200;
                        let responseHeaders = {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        };

                        if (request !== undefined && request.method === "POST" && request.url.endsWith("beta/roleManagement/directory/estimateAccess")) {
                            let payload = request.postData;
                            if (payload.includes('"resourceAction":"microsoft.directory/tenantManagement/tenants/create"')) {
                                console.log('create tenant');
                                // Extract the directoryScopeId value from the payload
                                let directoryScopeId = payload.match(/"directoryScopeId":"(.*?)","resourceAction"/)[1];
                                responseBody = `{"@odata.context":"https://graph.microsoft.com/beta/$metadata#Collection(microsoft.graph.resourceActionAuthorizationDecision)","value":[{"directoryScopeId":"/${directoryScopeId}","resourceAction":"microsoft.directory/tenantManagement/tenants/create","accessDecision":"allowed","missingClaims":[]}]}`;
                                modified = true;
                                params.interceptionHandled = true;
                            } else if (payload.includes('"resourceAction":"microsoft.directory/provisioningLogs/standard/read"') || payload.includes('"resourceAction":"microsoft.directory/auditLogs/standard/read"')) {
                                payload.includes('"resourceAction":"microsoft.directory/provisioningLogs/standard/read"') ? console.log('provisioningLogs') : console.log('auditLogs');
                                responseBody = '{"@odata.context":"https://graph.microsoft.com/beta/$metadata#Collection(microsoft.graph.resourceActionAuthorizationDecision)","value":[{"directoryScopeId":"/","resourceAction":"microsoft.directory/auditLogs/standard/read","accessDecision":"allowed","missingClaims":[]},{"directoryScopeId":"/","resourceAction":"microsoft.directory/signInReports/standard/read","accessDecision":"allowed","missingClaims":[]},{"directoryScopeId":"/","resourceAction":"microsoft.directory/provisioningLogs/standard/read","accessDecision":"allowed","missingClaims":[]}]}';
                                modified = true;
                            }
                            else if (payload.includes('"resourceAction":"microsoft.directory/groups/members/update"')) {
                                responseBody = '{"@odata.context":"https://graph.microsoft.com/beta/$metadata#Collection(microsoft.graph.resourceActionAuthorizationDecision)","value":[{"directoryScopeId":"/${directoryScopeId}","resourceAction":"microsoft.directory/groups/members/update","accessDecision":"allowed","missingClaims":[]},{"directoryScopeId":"/${directoryScopeId}","resourceAction":"microsoft.directory/groupsAssignableToRoles/members/update","accessDecision":"notAllowed","missingClaims":[]},{"directoryScopeId":"/${directoryScopeId}","resourceAction":"microsoft.directory/groups/members/read","accessDecision":"allowed","missingClaims":[]},{"directoryScopeId":"/${directoryScopeId}","resourceAction":"microsoft.directory/groupsAssignableToRoles/members/read","accessDecision":"notAllowed","missingClaims":[]}]}';
                                modified = true;
                            }
                            else if (payload.includes('"resourceAction":"microsoft.directory/groups/basic/update"')) {
                                responseBody = '{"@odata.context":"{"@odata.context":"https://graph.microsoft.com/beta/$metadata#Collection(microsoft.graph.resourceActionAuthorizationDecision)","value":[{"directoryScopeId":"/${directoryScopeId}","resourceAction":"microsoft.directory/groups/basic/update","accessDecision":"allowed","missingClaims":[]},{"directoryScopeId":"/${directoryScopeId}","resourceAction":"microsoft.directory/groupsAssignableToRoles/basic/update","accessDecision":"notAllowed","missingClaims":[]}]}';
                                modified = true;
                            }
                            else {
                                console.log('New check found!')
                                console.log(payload)
                            }
                            if (modified) {
                                console.log("Request was modified");
                                chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.continueInterceptedRequest', {
                                    interceptionId: interceptionId,
                                    rawResponse: btoa('HTTP/1.1 ' + statusCode + ' OK\r\n' +
                                        Object.keys(responseHeaders).map(function (key) {
                                            return key + ': ' + responseHeaders[key];
                                        }).join('\r\n') + '\r\n\r\n' +
                                        responseBody)
                                });
                            }
                        }
                        else if (request !== undefined && request.method === "GET" && (request.url.endsWith("api/Permissions") || request.url.endsWith("api/Permissions?forceRefresh=false") || request.url.endsWith("api/Permissions?forceRefresh=true"))) {
                            responseBody = `{"allowedActions":{"administrativeunit":["create","read","update","delete","inviteguest","listtasks"],"application":["create","read","update","delete","inviteguest","listtasks"],"approleassignment":["create","read","update","delete","inviteguest","listtasks"],"collaborationspace":["create","read","update","delete","inviteguest","listtasks"],"contact":["create","read","update","delete","inviteguest","listtasks"],"contract":["create","read","update","delete","inviteguest","listtasks"],"device":["create","read","update","delete","inviteguest","listtasks"],"directoryrole":["create","read","update","delete","inviteguest","listtasks"],"directoryroletemplate":["create","read","update","delete","inviteguest","listtasks"],"directorysetting":["create","read","update","delete","inviteguest","listtasks"],"directorysettingtemplate":["create","read","update","delete","inviteguest","listtasks"],"domain":["create","read","update","delete","inviteguest","listtasks"],"group":["create","read","update","delete","inviteguest","listtasks"],"logintenantbranding":["create","read","update","delete","inviteguest","listtasks"],"oauth2permissiongrant":["create","read","update","delete","inviteguest","listtasks"],"policy":["create","read","update","delete","inviteguest","listtasks"],"roleassignment":["create","read","update","delete","inviteguest","listtasks"],"roledefinition":["create","read","update","delete","inviteguest","listtasks"],"scopedrolemembership":["create","read","update","delete","inviteguest","listtasks"],"serviceaction":["activateservice","checkmembergroups","consent","consentonbehalfofall","disabledirectoryfeature","enabledirectoryfeature","getavailableextentionproperties","getmembergroups","getmemberobjects","getobjectsbyobjectids","ismemberof"],"serviceprincipal":["create","read","update","delete","inviteguest","listtasks"],"subscribedsku":["create","read","update","delete","inviteguest","listtasks"],"tenantdetail":["create","read","update","delete","inviteguest","listtasks"],"user":["create","read","update","delete","inviteguest","listtasks","activateserviceplan","changeuserpassword","invalidateallrefreshtokens"],"applicationproxytenantsettings":["read","update"],"applicationproxyappsettings":["read","update"],"applicationproxyconnector":["read","update"],"applicationproxyconnectorgroup":["read","update","create","delete"],"authenticationmethods":["create","read","update","delete","inviteguest","listtasks"],"companyrelationships":["read","create","update","delete"],"passwordpolicy":["create","read","update","delete","inviteguest","listtasks"],"previewfeatures":["read","create","update","delete"],"consent":["create"],"diagnostics":["read"],"reports":["read"],"aadvisor":["read","update"],"userprovisioningreports":["read"],"armaadiamdiagnosticsettings":["read"],"passwordresetpolicy":["read","update"],"userpassword":["update"],"userprovisioning":["read"],"multifactorauthentication":["create","read","update","delete","inviteguest","listtasks"],"licenses":["read","create","update","delete"],"mdmapplication":["read","create","update","delete"],"selfserviceappaccess":["create","read","update","delete","inviteguest","listtasks"],"entappsusersettings":["update"],"dynamicgroup":["read","create","update","delete"],"galleryapp":["read","create","update","delete"],"devicesettings":["update","read"],"directorygroupsettings":["read","update"],"directorygroupgeneralsettings":["read","update"],"directorygrouplifecyclesettings":["read","update"],"directorygroupnamingsettings":["read","update"],"notificationsusersettings":["create","read","update","delete","inviteguest","listtasks"],"triallicenses":["create","read","update","delete","inviteguest","listtasks"],"syncingdevice":["create","read","update","delete","inviteguest","listtasks"],"bitlocker":["read"],"identityprotection":["read","update"],"identityprotectiondismiss":["update"],"classicpolicy":["update","delete"],"userprofilerestrictedproperties":["update"],"privilegedstrongauthentication":["read","update"],"conditionalaccess":["read"],"userprofilebasicproperties":["update"],"userprofilerevokesessions":["delete"],"uxidsecurescore":["read","update"],"identityprovider":["create","read","update","delete","inviteguest","listtasks"],"bulkoperations":["inviteguest","listtasks","read"],"userbasicproperties":["update"],"userlocationproperties":["update"],"userstrongauthproperties":["update"],"userusagelocationproperties":["update"],"userconsentsettings":["update"],"permissionclassifications":["update"],"azureadconnect":["read"]},"ownerConditionalActions":{"application":["delete","restore","update"],"device":["update"],"group":["delete","restore","update"],"policy":["delete","update"],"serviceprincipal":["delete","update"]},"notApplicableActions":{}}`
                            chrome.debugger.sendCommand({ tabId: tab.id }, 'Network.continueInterceptedRequest', {
                                interceptionId: interceptionId,
                                rawResponse: btoa('HTTP/1.1 ' + statusCode + ' OK\r\n' +
                                    Object.keys(responseHeaders).map(function (key) {
                                        return key + ': ' + responseHeaders[key];
                                    }).join('\r\n') + '\r\n\r\n' +
                                    responseBody)
                            });
                        }
                        else {
                            console.log("Continue");
                            chrome.debugger.sendCommand({ tabId: tab.id }, "Network.continueInterceptedRequest", {
                                interceptionId: params.interceptionId
                            });
                        }
                    }

                });

            });
        });
    });
}

function turnOff() {
    console.log("Extension turned off");
    // Loop through all attached tabs
    attachedTabs.forEach(function (tabId) {
        // Detach the tab by moving it to the last position in the window
        chrome.tabs.move(tabId, { index: -1 }, function () {
            // Remove the tab ID from the attachedTabs Set
            attachedTabs.delete(tabId);
            // Detach the debugger for this tab
            chrome.debugger.detach({ tabId: tabId });
        });
    });
}

chrome.storage.sync.get(['isActive'], function (item) {
    if (item.isActive) {
        console.log("Extension activated");
        executeExtension();
    }
    else {
        turnOff();
    }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    // Check if the 'isActive' parameter has been updated
    if (changes.isActive !== undefined && changes.isActive.newValue === true) {
        console.log("Extension activated again");
        executeExtension();
    } else {
        turnOff();
    }
});