import GenerationView from "@components/GenerationView";
import Upload from "@components/Upload";
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
      <Upload />
      {generations?.map((g) =>
        <GenerationView key={g} generation_id={g} />
      )}
    </div>
  )
}

export default Home
