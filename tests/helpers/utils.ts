import { assert } from "chai"

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function assertErrorLogContains(
  err: {
    logs: string[]
  },
  text: string
) {
  assert.ok(err.logs.find((log) => log.includes(text)))
}

export async function expectFail(func: Function, onError: Function) {
  try {
    await func()
    assert.fail("Expected function to throw")
  } catch (err) {
    if (err.code === "ERR_ASSERTION") {
      throw err
    } else {
      onError(err)
    }
  }
}

export function assertErrorCode(err: any, code) {
  assert.equal(err?.error?.errorCode?.code, code, `Expected code ${code}`)
}
