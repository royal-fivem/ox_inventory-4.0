if not lib then return end

local Utils = {}

local webHook = GetConvar('inventory:webhook', '')


local validHosts = {
	['i.imgur.com'] = true,
}

local validExtensions = {
	['png'] = true,
	['apng'] = true,
	['webp'] = true,
}

function Utils.IsValidImageUrl(url)
	if url:find('[%s%(%);"\'\\]') then return false end
	local host, extension = url:match('^https?://([^/]+).+%.([%l]+)$')
	return host and extension and validHosts[host] and validExtensions[extension]
end

if webHook ~= '' then
	local headers = { ['Content-Type'] = 'application/json' }

	---@param title string
	---@param message string
	---@param image string
	function Utils.DiscordEmbed(title, message, image, color)
		PerformHttpRequest(webHook, function() end, 'POST', json.encode({
			username = 'ox_inventory', embeds = {
				{
					title = title,
					color = color,
					footer = {
						text = os.date('%c'),
					},
					description = message,
					thumbnail = {
						url = image,
						width = 100,
					}
				}
			}
		}), headers)
	end
end

---@param playerId number
---@param event string
---@param msg string
---@param kickPlayer? boolean
function Utils.LogExploit(playerId, event, msg, kickPlayer)
    local warning = ('%s (%s) suspected of exploiting. %s'):format(GetPlayerName(playerId), playerId, msg)

    lib.print.warn(warning)
    lib.logger(playerId, ('%s:%s'):format(shared.resource, event), msg)

    if kickPlayer then
        DropPlayer(tostring(playerId), 'Dropped for suspicious behaviour.')
    end
end

return Utils
