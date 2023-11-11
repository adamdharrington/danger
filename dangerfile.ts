import { message, danger, fail, warn } from 'danger'
import { dependencies, peerDependencies } from './package.json'
import { readFileSync } from 'node:fs'

const modifiedMD = danger.git.modified_files.filter(Boolean).join('\n - ')
message('Changed Files in this PR: \n - ' + modifiedMD)

const createdMD = danger.git.created_files.filter(Boolean).join('\n - ')
message('New Files in this PR: \n - ' + createdMD)

const allSourceFiles = [
  ...danger.git.created_files,
  ...danger.git.modified_files,
].filter((path) => path.startsWith('src/'))

if (danger.github?.pr?.body.length < 10) {
  fail('This pull request needs a description.')
}

const hasCHANGELOGChanges = danger.git.modified_files.includes('CHANGELOG.md')
const hasLibraryChanges = allSourceFiles.length > 0
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

const hasNoTestChanges = allSourceFiles.filter((modified) => {
  if (modified.endsWith('.ts') && !modified.match(/\.(test|d)\.ts$/)) {
    const test = modified.replace(/\.ts$/, '.test.ts')
    return !allSourceFiles.includes(test)
  }
  return false
})

const newFilesWithNoTestChanges: string[] = []
const modifiedFilesWithNoTestChanges: string[] = []
hasNoTestChanges.forEach((path) => {
  if (danger.git.created_files.includes(path)) {
    newFilesWithNoTestChanges.push(path)
  } else {
    modifiedFilesWithNoTestChanges.push(path)
  }
})

if (modifiedFilesWithNoTestChanges.length) {
  warn(
    `source files changed without a test: ${modifiedFilesWithNoTestChanges.join(
      ', '
    )}`
  )
}
if (newFilesWithNoTestChanges.length) {
  fail(
    `source files added without tests: ${newFilesWithNoTestChanges.join(', ')}`
  )
}
