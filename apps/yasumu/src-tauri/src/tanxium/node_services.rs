use deno_core::FastString;
use deno_core::ModuleSpecifier;
use deno_resolver::npm::ByonmNpmResolverCreateOptions;
use deno_resolver::npm::CreateInNpmPkgCheckerOptions;
use deno_resolver::npm::DenoInNpmPackageChecker;
use deno_resolver::npm::NpmResolver;
use deno_runtime::deno_node::NodeExtInitServices;
use deno_runtime::deno_node::NodeRequireLoader;
use deno_runtime::deno_node::NodeResolver;
use node_resolver::DenoIsBuiltInNodeModuleChecker;
use node_resolver::NodeResolverOptions;
use node_resolver::PackageJsonResolver;
use node_resolver::cache::NodeResolutionSys;
use node_resolver::errors::PackageJsonLoadError;
use std::borrow::Cow;
use std::path::Path;
use std::rc::Rc;
use std::sync::Arc;
use sys_traits::FsRead;
use sys_traits::impls::RealSys;

use deno_error::JsErrorBox;

pub struct TanxiumNodeRequireLoader {
    sys: RealSys,
    #[allow(dead_code)]
    in_npm_pkg_checker: DenoInNpmPackageChecker,
}

impl TanxiumNodeRequireLoader {
    pub fn new() -> Self {
        let sys = RealSys::default();
        Self {
            sys: sys.clone(),
            in_npm_pkg_checker: DenoInNpmPackageChecker::new(CreateInNpmPkgCheckerOptions::Byonm),
        }
    }
}

impl NodeRequireLoader for TanxiumNodeRequireLoader {
    fn ensure_read_permission<'a>(
        &self,
        _permissions: &mut dyn deno_runtime::deno_node::NodePermissions,
        path: Cow<'a, Path>,
    ) -> Result<Cow<'a, Path>, JsErrorBox> {
        Ok(path)
    }

    fn load_text_file_lossy(&self, path: &Path) -> Result<FastString, JsErrorBox> {
        match self.sys.fs_read_to_string_lossy(path) {
            Ok(text) => Ok(match text {
                Cow::Borrowed(s) => FastString::from_static(s),
                Cow::Owned(s) => s.into(),
            }),
            Err(err) => Err(JsErrorBox::from_err(err)),
        }
    }

    fn is_maybe_cjs(&self, _specifier: &ModuleSpecifier) -> Result<bool, PackageJsonLoadError> {
        Ok(true)
    }

    fn resolve_require_node_module_paths(&self, from: &Path) -> Vec<String> {
        deno_runtime::deno_node::default_resolve_require_node_module_paths(from)
    }
}

pub fn create_node_init_services(
    node_require_loader: Rc<dyn NodeRequireLoader>,
    node_resolver: Arc<NodeResolver<DenoInNpmPackageChecker, NpmResolver<RealSys>, RealSys>>,
    pkg_json_resolver: Arc<PackageJsonResolver<RealSys>>,
) -> NodeExtInitServices<DenoInNpmPackageChecker, NpmResolver<RealSys>, RealSys> {
    NodeExtInitServices {
        node_require_loader,
        node_resolver,
        pkg_json_resolver,
        sys: RealSys::default(),
    }
}

pub fn create_node_resolver(
    npm_resolver: NpmResolver<RealSys>,
    pkg_json_resolver: Arc<PackageJsonResolver<RealSys>>,
) -> Arc<NodeResolver<DenoInNpmPackageChecker, NpmResolver<RealSys>, RealSys>> {
    let sys = RealSys::default();
    let in_npm_pkg_checker = DenoInNpmPackageChecker::new(CreateInNpmPkgCheckerOptions::Byonm);
    let node_resolution_sys = NodeResolutionSys::new(sys.clone(), None);
    Arc::new(NodeResolver::new(
        in_npm_pkg_checker,
        DenoIsBuiltInNodeModuleChecker,
        npm_resolver,
        pkg_json_resolver,
        node_resolution_sys,
        NodeResolverOptions::default(),
    ))
}

pub fn create_pkg_json_resolver() -> Arc<PackageJsonResolver<RealSys>> {
    let sys = RealSys::default();
    Arc::new(PackageJsonResolver::new(sys, None))
}

pub fn create_npm_resolver(
    pkg_json_resolver: Arc<PackageJsonResolver<RealSys>>,
) -> NpmResolver<RealSys> {
    let sys = RealSys::default();
    NpmResolver::<RealSys>::new(deno_resolver::npm::NpmResolverCreateOptions::Byonm(
        ByonmNpmResolverCreateOptions {
            root_node_modules_dir: None,
            sys: NodeResolutionSys::new(sys.clone(), None),
            pkg_json_resolver: pkg_json_resolver.clone(),
        },
    ))
}
