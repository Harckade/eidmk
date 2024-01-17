# About
Entra ID Master Key (EIDMK) is a Google Chrome extension that allows you to bypass Azure and Microsoft Entra ID portal restrictions by tricking your client (web browser) to send (legit and allowed) requests to Microsoft endpoints and thus receiving information that, usually, you would not be allowed to access through UI.
It works similar to AzureHound by [BloodHoundAD](https://github.com/BloodHoundAD/AzureHound), except you don't need to use a terminal for this and can run it directly on your Google Chrome.

> [!WARNING]
> Harckade is not associated with any entity that is not listed on [Harckade](https://www.harckade.com) official website nor responsible for any damage/content that those entities may produce.
> This exention provides same functionalities as using PowerShell or CLI - There is NO vulnerabilities being exploited, just taking advantage of Azure portal features

In fact, even Microsoft official documentation states that the UI restriction does not restrict anyone, who has access to a tenant, from retrieving the information from Entra ID - find out more  on [this article](https://www.linkedin.com/pulse/microsoft-azure-active-directory-authorization-bypass-vlad-yultyyev/).

This extension may be handy if you are a security professional who needs a quick solution to analyze Microsoft Entra ID tenant.

## Requirements

You need to be a user of particular tenant to view the content of that tenant.


## What can you expect to access using this extension?
- List all groups that exist on the tenant
- List all users and retrieve their information
- List Application Registrations (names, URI, exposed APIs, roles, secret IDs, etc)
- List Enterprise applications
- List devices (names, operating system version, etc)
- Create new tenants (an active Azure subscription is required for this action. Depending on your organization settings, only Azure AD B2C tenants may be allowed)


## Which Chrome permissions are required and why?
- **storageStore** - information about extension status: It may be turned ON and OFF
- **tabs** - Tabs permission is needed to allow extension to open a listener on a specific tab. This is also required to allow multi-tab support, when the user has multiple tenants opened.
- **debugger** - Needed to intercept requests coming from Azure/Microsoft Entra ID portal and modify the (server) response in order to trick the client (browser) to think that it has all privileges on the UI - this will make the client send additional calls to Microsoft endpoints by following original and unmodified Microsoft JavaScript files.
- **host** - The extension needs to understand if the HTTP requests are from Microsoft. Only if the requests are coming from Microsoft, the interception and modification of the response will happen.
