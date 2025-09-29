import { Component, Vec3 } from "horizon/core";
import NavMeshManager, { NavMesh, NavMeshState } from "horizon/navmesh";

export class NavMeshController extends Component<typeof NavMeshController> {
  private static instance: NavMeshController | undefined;

  private isNavMeshInitialized = false;
  private navMesh: NavMesh | undefined;

  async preStart() {
    NavMeshController.instance = this;
    await this.initializeNavMesh();
  }

  async start() {}

  public static getWaypointsBetween(startPosition: Vec3, targetPosition: Vec3) {
    const navMeshController = NavMeshController.instance;
    if (!navMeshController?.isNavMeshInitialized) {
      console.error("NavMesh is initializing");
      return;
    }

    if (!navMeshController.navMesh) {
      console.error("NavMesh is not available");
      return;
    }

    if (navMeshController.navMesh.getStatus().state !== NavMeshState.Ready) {
      console.error("NavMesh is not ready");
      return;
    }

    const navMesh = navMeshController.navMesh;
    if (!navMesh) {
      console.error("NavMesh is not available");
      return;
    }

    const nearestStartPosition = navMesh.getNearestPoint(startPosition, 5) ?? undefined;
    if (nearestStartPosition === undefined) {
      console.error("Could not find nearest start position on NavMesh");
      return;
    }

    const nearestTargetPosition = navMesh.getNearestPoint(targetPosition, 5) ?? undefined;
    if (nearestTargetPosition === undefined) {
      console.error("Could not find nearest target position on NavMesh");
      return;
    }

    const path = navMesh.getPath(nearestStartPosition, nearestTargetPosition) ?? undefined;
    if (path === undefined) {
      console.error("Path is not available");
      return;
    }

    const waypoints = path.waypoints;
    return waypoints;
  }

  protected async initializeNavMesh() {
    const navMeshManager = NavMeshManager.getInstance(this.world);
    const navMeshes = await navMeshManager.getNavMeshes();
    if (navMeshes.length === 0) {
      console.error("No NavMeshes available in the world");
      return;
    }

    this.navMesh = navMeshes[0];
    if (this.navMesh === undefined) {
      console.error("NavMesh is not available");
      return;
    }

    await this.navMesh.rebake().then((success) => {
      if (!success) {
        console.error("NavMesh rebake failed");
      }
    });

    this.isNavMeshInitialized = true;
  }
}
Component.register(NavMeshController);
