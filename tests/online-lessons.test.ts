import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  generateUserToken: vi.fn(),
  streamClient: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
}));

vi.mock("@stream-io/node-sdk", () => ({
  StreamClient: mocks.streamClient,
}));

describe("modulul de lectii online", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_STREAM_API_KEY", "stream_key");
    vi.stubEnv("STREAM_SECRET_KEY", "stream_secret");
    mocks.generateUserToken.mockReturnValue("generated-token");
    mocks.streamClient.mockImplementation(function StreamClientMock() {
      return {
      generateUserToken: mocks.generateUserToken,
      };
    });
  });

  it("genereaza token Stream pentru utilizatorul autentificat", async () => {
    mocks.currentUser.mockResolvedValue({ id: "clerk_user_1" });
    const { tokenProvider } = await import("@/actions/stream.actions");

    await expect(tokenProvider()).resolves.toBe("generated-token");

    expect(mocks.streamClient).toHaveBeenCalledWith("stream_key", "stream_secret");
    expect(mocks.generateUserToken).toHaveBeenCalledWith({
      user_id: "clerk_user_1",
      exp: expect.any(Number),
    });
  });

  it("opreste generarea tokenului daca utilizatorul nu este autentificat", async () => {
    mocks.currentUser.mockResolvedValue(null);
    const { tokenProvider } = await import("@/actions/stream.actions");

    await expect(tokenProvider()).rejects.toThrow("User is not logged in");
  });
});
