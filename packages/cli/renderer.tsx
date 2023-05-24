import { Actions } from "@jackyzha0/quartz-plugins/types"
import { render } from 'preact-render-to-string'
import { QuartzConfig } from "./config"
import { JSResource, StaticResources } from '@jackyzha0/quartz-lib/types'
import path from 'path'
import fs from 'fs'
import { HYDRATION_SCRIPT } from './hydration'
import { resolveToRoot } from '@jackyzha0/quartz-lib'

export function createBuildPageAction(outputDirectory: string, cfg: QuartzConfig, staticResources: StaticResources): Actions["buildPage"] {
  return async ({ slug, ext, title, description, componentName, props }) => {
    const hydrationData = cfg.configuration.hydrateInteractiveComponents
      ? <script id="__QUARTZ_HYDRATION_DATA__" type="application/quartz-data" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          props,
          componentName
        })
      }} />
      : null

    const pathToRoot = resolveToRoot(slug)
    const resources = { ...staticResources }
    if (cfg.configuration.hydrateInteractiveComponents) {
      resources.js.push({
        src: path.join(pathToRoot, HYDRATION_SCRIPT),
        loadTime: 'afterDOMReady'
      })
    }

    const Head = cfg.components.head
    const Component = cfg.components[componentName]

    // @ts-ignore
    const element = <Component {...props} id="quartz-body" />

    const doc = <html id="quartz-root">
      <Head title={title} description={description} baseDir={pathToRoot} externalResources={resources} />
      <body>
        {element}
        {hydrationData}
        {resources.js.filter(resource => resource.loadTime === "afterDOMReady").map((resource: JSResource) => <script key={resource.src} src={resource.src} />)}
      </body>
    </html>

    const pathToPage = path.join(outputDirectory, slug + ext)
    const dir = path.dirname(pathToPage)
    await fs.promises.mkdir(dir, { recursive: true })
    await fs.promises.writeFile(pathToPage, "<!DOCTYPE html>\n" + render(doc))
    return pathToPage
  }
}
