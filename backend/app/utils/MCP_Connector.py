from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from contextlib import AsyncExitStack

class MCPClient:
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.session: ClientSession | None = None
        self.exit_stack = AsyncExitStack()
        self._streams_context = None
        self._session_context = None

    async def connect(self, headers=None):
        self._streams_context = streamablehttp_client(
            url=self.server_url, headers=headers or {}
        )
        read_stream, write_stream, _ = await self._streams_context.__aenter__()
        self._session_context = ClientSession(read_stream, write_stream)
        self.session = await self._session_context.__aenter__()
        await self.session.initialize()

    async def call_tool(self, tool_name, arguments):
        try:
            return await self.session.call_tool(tool_name, arguments)
        except Exception:
            await self.cleanup()
            await self.connect()
            return await self.session.call_tool(tool_name, arguments)

    async def cleanup(self):
        if self._session_context:
            await self._session_context.__aexit__(None, None, None)
            self._session_context = None
        if self._streams_context:
            await self._streams_context.__aexit__(None, None, None)
            self._streams_context = None
        self.session = None
