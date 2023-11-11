import { message, danger, fail, warn } from 'danger'
import { dependencies, peerDependencies } from './package.json'
import { readFileSync } from 'node:fs'

const modifiedMD = danger.git.modified_files.join('- ')
message('Changed Files in this PR: \n - ' + modifiedMD)

if (danger.github?.pr?.body.length < 10) {
  fail('This pull request needs a description.')
}

const hasCHANGELOGChanges = danger.git.modified_files.includes('CHANGELOG.md')
const hasLibraryChanges = danger.git.modified_files.some((path) =>
  path.startsWith('src/')
)
if (hasLibraryChanges && !hasCHANGELOGChanges) {
  warn('This pull request may need a CHANGELOG entry.')
}

const readme = readFileSync('README.md', 'utf8')
function findUndocumented(words: string[]) {
  return words.filter((dep) => {
    return !readme.match(new RegExp(`\b${dep}\b`, 'gi'))
  })
}
const undocumentedDependencies = findUndocumented(Object.keys(dependencies))
const undocumentedPeerDependencies = findUndocumented(
  Object.keys(peerDependencies)
)
if (undocumentedDependencies.length) {
  warn(
    `These packages are dependencies but are not mentioned in the README: ${undocumentedDependencies.join(
      ', '
    )}`
  )
}
if (undocumentedPeerDependencies.length) {
  fail(
    `These packages are peer dependencies but are not mentioned in the README: ${undocumentedPeerDependencies.join(
      ', '
    )}`
  )
}

console.log(danger.git.modified_files)

const hasNoTestChanges = danger.git.modified_files.filter((modified) => {
  if (
    modified.startsWith('src/') &&
    modified.endsWith('.ts') &&
    !modified.match(/\.(test|d)\.ts$/)
  ) {
    const test = modified.replace(/\.ts$/, '.test.ts')
    return !danger.git.modified_files.includes(test)
  }
  return false
})

const newFilesWithNoTestChanges = hasNoTestChanges.filter((path) =>
  danger.git.created_files.includes(path)
)

if (hasNoTestChanges.length) {
  warn(`source files changed without a test: ${hasNoTestChanges.join(', ')}`)
}
if (newFilesWithNoTestChanges.length) {
  fail(
    `source files added without tests: ${newFilesWithNoTestChanges.join(', ')}`
  )
}
