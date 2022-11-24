import GenerationView from "@components/GenerationView";
import useGenerations from "@hooks/useGenerations"

function Home() {
  const { isLoading, generations } = useGenerations();

  if (isLoading) {
    return (
      <div>Loading generations...</div>
    )
  }

  return (
    <div>
      {generations?.map((g) =>
        <GenerationView key={g} generation_id={g} />
      )}
    </div>
  )
}

export default Home
