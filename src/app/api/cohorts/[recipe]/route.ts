import { NextResponse } from "next/server";
import { RECIPES, type RecipeKey } from "@/lib/cohorts";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { recipe: string } }
) {
  const key = params.recipe as RecipeKey;
  const recipe = (RECIPES as any)[key];
  if (!recipe) {
    return NextResponse.json({ error: `Unknown recipe: ${params.recipe}` }, { status: 404 });
  }
  const rows = recipe.run();
  return NextResponse.json({
    label: recipe.label,
    description: recipe.description,
    rows,
  });
}
